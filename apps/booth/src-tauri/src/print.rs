use base64::Engine;
use serde::Serialize;
use windows::core::{Error, PCWSTR, PWSTR};
use windows::Win32::Foundation::{GlobalFree, HGLOBAL};
use windows::Win32::Graphics::Gdi::{
    CreateDCW, DeleteDC, GetDeviceCaps, StretchDIBits, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
    DEVMODEW, DIB_RGB_COLORS, DMORIENT_LANDSCAPE, DMORIENT_PORTRAIT, DMPAPER_USER, DM_COPIES,
    DM_ORIENTATION, DM_OUT_BUFFER, DM_PAPERLENGTH, DM_PAPERSIZE, DM_PAPERWIDTH, HORZRES, SRCCOPY,
    VERTRES,
};
use windows::Win32::Graphics::Printing::{
    ClosePrinter, DocumentPropertiesW, EndDocPrinter, EndPagePrinter, EnumPrintersW,
    GetDefaultPrinterW, OpenPrinterW, StartDocPrinterW, StartPagePrinter, WritePrinter,
    DOC_INFO_1W, PRINTER_ALL_ACCESS, PRINTER_DEFAULTSW, PRINTER_ENUM_LOCAL, PRINTER_HANDLE,
    PRINTER_INFO_2W,
};
use windows::Win32::Storage::Xps::{EndDoc, EndPage, StartDocW, StartPage, DOCINFOW};
use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE, GMEM_ZEROINIT};
use windows::Win32::UI::Controls::Dialogs::{
    GetSaveFileNameW, PrintDlgW, DEVNAMES, OFN_HIDEREADONLY, OFN_NOCHANGEDIR, OFN_OVERWRITEPROMPT,
    OFN_PATHMUSTEXIST, OPENFILENAMEW, PD_HIDEPRINTTOFILE, PD_NOPAGENUMS, PRINTDLGW,
};

const MAX_THERMAL_WIDTH: u32 = 576;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrinterInfo {
    pub name: String,
    pub driver: String,
    pub port: String,
    pub thermal: bool,
}

fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

fn wide_to_string(p: PWSTR) -> String {
    if p.0.is_null() {
        return String::new();
    }
    let len = unsafe { (0..).take_while(|&i| *p.0.add(i) != 0).count() };
    let slice = unsafe { std::slice::from_raw_parts(p.0, len) };
    String::from_utf16_lossy(slice)
}

fn is_thermal_driver(driver: &str) -> bool {
    let d = driver.to_lowercase();
    ["tm-", "thermal", "escpos", "pos-", "tsc", "zebra", "sens", "epson", "recibo", "docket"]
        .iter()
        .any(|k| d.contains(k))
}

pub fn list_printers() -> Result<Vec<PrinterInfo>, String> {
    let mut needed: u32 = 0;
    let mut returned: u32 = 0;

    // First call probes the required buffer size (returns ERROR_INSUFFICIENT_BUFFER).
    let _ = unsafe {
        EnumPrintersW(
            PRINTER_ENUM_LOCAL,
            PWSTR(std::ptr::null_mut()),
            2,
            None,
            &mut needed,
            &mut returned,
        )
    };
    if needed == 0 {
        return Ok(Vec::new());
    }

    let mut buf = vec![0u8; needed as usize];
    unsafe {
        EnumPrintersW(
            PRINTER_ENUM_LOCAL,
            PWSTR(std::ptr::null_mut()),
            2,
            Some(&mut buf),
            &mut needed,
            &mut returned,
        )
    }
    .map_err(|e| format!("No se pudo enumerar impresoras: {e}"))?;

    let info = unsafe {
        std::slice::from_raw_parts(buf.as_ptr() as *const PRINTER_INFO_2W, returned as usize)
    };

    let mut printers = Vec::with_capacity(info.len());
    for p in info {
        let name = wide_to_string(p.pPrinterName);
        let driver = wide_to_string(p.pDriverName);
        let port = wide_to_string(p.pPortName);
        printers.push(PrinterInfo {
            name,
            thermal: is_thermal_driver(&driver),
            driver,
            port,
        });
    }
    Ok(printers)
}

fn send_raw(printer_name: &str, bytes: &[u8]) -> Result<(), String> {
    let pname = to_wide(printer_name);
    let mut handle = PRINTER_HANDLE::default();
    let defaults = PRINTER_DEFAULTSW {
        pDatatype: PWSTR(std::ptr::null_mut()),
        pDevMode: std::ptr::null_mut(),
        DesiredAccess: PRINTER_ALL_ACCESS,
    };
    unsafe { OpenPrinterW(PWSTR(pname.as_ptr() as *mut u16), &mut handle, Some(&defaults)) }
        .map_err(|e| format!("No se pudo abrir la impresora: {e}"))?;

    let result = (|| {
        let doc_name = to_wide("Cabina Photobooth");
        let out_file = to_wide("");
        let datatype = to_wide("RAW");
        let doc_info = DOC_INFO_1W {
            pDocName: PWSTR(doc_name.as_ptr() as *mut u16),
            pOutputFile: PWSTR(out_file.as_ptr() as *mut u16),
            pDatatype: PWSTR(datatype.as_ptr() as *mut u16),
        };

        let job = unsafe { StartDocPrinterW(handle, 1, &doc_info) };
        if job == 0 {
            return Err(format!(
                "No se pudo iniciar el trabajo de impresión: {}",
                Error::from_win32()
            ));
        }

        if unsafe { StartPagePrinter(handle) } == false {
            return Err(format!("No se pudo iniciar la página: {}", Error::from_win32()));
        }

        let mut written: u32 = 0;
        let ok = unsafe {
            WritePrinter(
                handle,
                bytes.as_ptr() as *const core::ffi::c_void,
                bytes.len() as u32,
                &mut written,
            )
        } != false;
        if !ok {
            return Err(format!("Fallo al escribir en la impresora: {}", Error::from_win32()));
        }

        let _ = unsafe { EndPagePrinter(handle) };
        let _ = unsafe { EndDocPrinter(handle) };
        Ok(())
    })();

    unsafe { ClosePrinter(handle) }
        .map_err(|e| format!("No se pudo cerrar la impresora: {e}"))?;

    result
}

fn raster_to_escpos(img: &image::GrayImage) -> Vec<u8> {
    let width = img.width() as usize;
    let height = img.height() as usize;
    let bytes_per_row = (width + 7) / 8;

    let mut data = Vec::with_capacity(bytes_per_row * height + 16);
    data.extend_from_slice(&[0x1B, 0x40]); // ESC @ initialize
    data.push(0x1D); // GS
    data.push(0x76); // v
    data.push(0x30); // 0
    data.push(0x00); // m = 0 (normal)
    data.push((bytes_per_row & 0xFF) as u8);
    data.push(((bytes_per_row >> 8) & 0xFF) as u8);
    data.push((height & 0xFF) as u8);
    data.push(((height >> 8) & 0xFF) as u8);

    for y in 0..height {
        for byte in 0..bytes_per_row {
            let mut b: u8 = 0;
            for bit in 0..8 {
                let x = byte * 8 + bit;
                if x < width {
                    let px = img.get_pixel(x as u32, y as u32);
                    if px.0[0] < 128 {
                        b |= 1 << (7 - bit);
                    }
                }
            }
            data.push(b);
        }
    }

    data.extend_from_slice(&[0x1D, 0x56, 0x42, 0x00]); // GS V B 0 (cut)
    data
}

pub fn print_thermal(
    printer_name: Option<String>,
    png_base64: &str,
    copies: Option<u32>,
) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(png_base64)
        .map_err(|e| format!("Imagen base64 inválida: {e}"))?;

    let img = image::load_from_memory(&bytes)
        .map_err(|e| format!("No se pudo decodificar la imagen: {e}"))?;

    let (w, h) = (img.width(), img.height());
    let resized = if w > MAX_THERMAL_WIDTH {
        let new_h = (h as f32 * (MAX_THERMAL_WIDTH as f32 / w as f32)).max(1.0) as u32;
        image::imageops::resize(
            &img.to_rgb8(),
            MAX_THERMAL_WIDTH,
            new_h,
            image::imageops::FilterType::Lanczos3,
        )
    } else {
        img.to_rgb8()
    };
    let gray = image::DynamicImage::ImageRgb8(resized).to_luma8();

    let printer = match printer_name {
        Some(p) => p,
        None => {
            let printers = list_printers()?;
            printers
                .iter()
                .find(|p| p.thermal)
                .map(|p| p.name.clone())
                .ok_or_else(|| "No se encontró una impresora térmica".to_string())?
        }
    };

    let escpos = raster_to_escpos(&gray);
    let n = copies.unwrap_or(1).max(1);
    for _ in 0..n {
        send_raw(&printer, &escpos)?;
    }
    Ok(())
}

/// Pide al driver su DEVMODE por defecto para esta impresora (respeta
/// cualquier configuración específica del driver) y le sobreescribe solo
/// orientación/tamaño de papel si se pidieron — así no perdemos ajustes del
/// driver que no nos interesa tocar. El tamaño de papel se recibe ya
/// resuelto en milímetros (la tabla de presets — tira 2x6, 4R, polaroid,
/// etc. — vive del lado de TypeScript, no aquí, para no duplicarla).
fn build_devmode(
    printer_name: &str,
    orientation: Option<&str>,
    width_mm: Option<f64>,
    height_mm: Option<f64>,
) -> Result<Option<DEVMODEW>, String> {
    let wants_orientation = matches!(orientation, Some(o) if o != "auto");

    let pname = to_wide(printer_name);
    let mut handle = PRINTER_HANDLE::default();
    let defaults = PRINTER_DEFAULTSW {
        pDatatype: PWSTR(std::ptr::null_mut()),
        pDevMode: std::ptr::null_mut(),
        DesiredAccess: PRINTER_ALL_ACCESS,
    };
    unsafe { OpenPrinterW(PWSTR(pname.as_ptr() as *mut u16), &mut handle, Some(&defaults)) }
        .map_err(|e| format!("No se pudo abrir la impresora: {e}"))?;

    let mut devmode = DEVMODEW {
        dmSize: std::mem::size_of::<DEVMODEW>() as u16,
        ..Default::default()
    };
    let result = unsafe {
        DocumentPropertiesW(
            None,
            handle,
            PCWSTR(pname.as_ptr()),
            Some(&mut devmode as *mut DEVMODEW),
            None,
            DM_OUT_BUFFER.0,
        )
    };
    let _ = unsafe { ClosePrinter(handle) };
    if result < 0 {
        return Err("No se pudo leer la configuración de la impresora".to_string());
    }

    // Los campos de orientación/tamaño/copias viven en esta unión del DEVMODE.
    let fields = unsafe { &mut devmode.Anonymous1.Anonymous1 };

    // El driver puede traer guardado un número de copias de un trabajo
    // anterior (algunos lo recuerdan entre impresiones). Si lo dejamos tal
    // cual, el propio driver duplicaría cada página que ya repetimos
    // nosotros con nuestro ciclo de StartPage — forzamos 1 aquí para que
    // el número de copias físicas lo controle un solo lugar.
    fields.dmCopies = 1;
    devmode.dmFields |= DM_COPIES;

    if wants_orientation {
        fields.dmOrientation = if orientation == Some("landscape") {
            DMORIENT_LANDSCAPE as i16
        } else {
            DMORIENT_PORTRAIT as i16
        };
        devmode.dmFields |= DM_ORIENTATION;
    }

    if let (Some(w), Some(h)) = (width_mm, height_mm) {
        if w > 0.0 && h > 0.0 {
            // dmPaperWidth/dmPaperLength están en décimas de milímetro.
            fields.dmPaperSize = DMPAPER_USER as i16;
            fields.dmPaperWidth = (w * 10.0).round() as i16;
            fields.dmPaperLength = (h * 10.0).round() as i16;
            devmode.dmFields |= DM_PAPERSIZE | DM_PAPERWIDTH | DM_PAPERLENGTH;
        }
    }

    Ok(Some(devmode))
}

fn get_default_printer_name() -> Result<String, String> {
    let mut needed: u32 = 0;
    let _ = unsafe { GetDefaultPrinterW(None, &mut needed) };
    if needed == 0 {
        return Err("No hay una impresora predeterminada configurada".to_string());
    }
    let mut buf: Vec<u16> = vec![0; needed as usize];
    let ok = unsafe { GetDefaultPrinterW(Some(PWSTR(buf.as_mut_ptr())), &mut needed) }.as_bool();
    if !ok {
        return Err(format!(
            "No se pudo obtener la impresora predeterminada: {}",
            Error::from_win32()
        ));
    }
    let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    Ok(String::from_utf16_lossy(&buf[..len]))
}

/// Abre la impresora, dibuja `img` (ya redimensionada por página, "cover
/// fit": llena toda la hoja sin deformar, recortando el sobrante — así no
/// quedan bordes blancos) y repite `copies` veces dentro del mismo trabajo
/// de impresión.
fn print_bitmap(
    printer_name: &str,
    devmode: Option<DEVMODEW>,
    img: &image::RgbImage,
    copies: u32,
    output_file: Option<&str>,
) -> Result<(), String> {
    let (img_w, img_h) = (img.width(), img.height());

    let driver = to_wide("WINSPOOL");
    let device = to_wide(printer_name);
    let hdc = unsafe {
        CreateDCW(
            PWSTR(driver.as_ptr() as *mut u16),
            PWSTR(device.as_ptr() as *mut u16),
            PWSTR(std::ptr::null_mut()),
            devmode.as_ref().map(|d| d as *const DEVMODEW),
        )
    };
    if hdc.is_invalid() {
        return Err(format!("No se pudo abrir la impresora \"{printer_name}\""));
    }

    let result = (|| -> Result<(), String> {
        let doc_name = to_wide("Cabina Photobooth");
        // "Microsoft Print to PDF"/XPS Document Writer y similares son
        // impresoras que escriben a un archivo — sin decirles a cuál, no
        // truenan con error, simplemente no generan nada. `output_file` es
        // la ruta que ya se le preguntó al operador para este caso.
        let out_file_wide = output_file.map(to_wide);
        let doc_info = DOCINFOW {
            cbSize: std::mem::size_of::<DOCINFOW>() as i32,
            lpszDocName: PCWSTR(doc_name.as_ptr()),
            lpszOutput: out_file_wide
                .as_ref()
                .map(|w| PCWSTR(w.as_ptr()))
                .unwrap_or(PCWSTR::null()),
            lpszDatatype: PCWSTR::null(),
            fwType: 0,
        };

        if unsafe { StartDocW(hdc, &doc_info) } <= 0 {
            return Err(format!(
                "No se pudo iniciar el trabajo de impresión: {}",
                Error::from_win32()
            ));
        }

        let page_w = unsafe { GetDeviceCaps(Some(hdc), HORZRES) }.max(1);
        let page_h = unsafe { GetDeviceCaps(Some(hdc), VERTRES) }.max(1);

        // "Cover fit": la imagen cubre toda la página sin deformarse; lo
        // que sobra de un lado se recorta (offset negativo), en vez de
        // dejar franjas blancas como haría un "contain".
        let scale = (page_w as f32 / img_w as f32).max(page_h as f32 / img_h as f32);
        let draw_w = (img_w as f32 * scale).round() as i32;
        let draw_h = (img_h as f32 * scale).round() as i32;
        let offset_x = (page_w - draw_w) / 2;
        let offset_y = (page_h - draw_h) / 2;

        // DIB de 24 bits, filas de abajo hacia arriba, cada fila alineada a 4 bytes.
        let row_bytes = ((img_w as usize * 3 + 3) / 4) * 4;
        let mut dib = vec![0u8; row_bytes * img_h as usize];
        for y in 0..img_h {
            let src_y = img_h - 1 - y; // bottom-up
            let row_start = (y as usize) * row_bytes;
            for x in 0..img_w {
                let px = img.get_pixel(x, src_y).0;
                let i = row_start + (x as usize) * 3;
                dib[i] = px[2]; // B
                dib[i + 1] = px[1]; // G
                dib[i + 2] = px[0]; // R
            }
        }

        let bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: img_w as i32,
                biHeight: img_h as i32,
                biPlanes: 1,
                biBitCount: 24,
                biCompression: BI_RGB.0 as u32,
                ..Default::default()
            },
            ..Default::default()
        };

        for _ in 0..copies.max(1) {
            if unsafe { StartPage(hdc) } <= 0 {
                return Err(format!("No se pudo iniciar la página: {}", Error::from_win32()));
            }

            unsafe {
                StretchDIBits(
                    hdc,
                    offset_x,
                    offset_y,
                    draw_w,
                    draw_h,
                    0,
                    0,
                    img_w as i32,
                    img_h as i32,
                    Some(dib.as_ptr() as *const core::ffi::c_void),
                    &bmi,
                    DIB_RGB_COLORS,
                    SRCCOPY,
                );
            }

            if unsafe { EndPage(hdc) } <= 0 {
                return Err(format!("No se pudo finalizar la página: {}", Error::from_win32()));
            }
        }

        if unsafe { EndDoc(hdc) } <= 0 {
            return Err(format!(
                "No se pudo finalizar el trabajo de impresión: {}",
                Error::from_win32()
            ));
        }
        Ok(())
    })();

    let _ = unsafe { DeleteDC(hdc) };
    result
}

/// Imprime en la impresora predeterminada (no térmica) usando GDI directo,
/// sin mostrar el diálogo de impresión de Windows — para que los invitados
/// del evento no vean esa pantalla. `orientation`/`width_mm`+`height_mm`
/// sobreescriben el DEVMODE del driver (ver `build_devmode`); `copies`
/// repite la página dentro del mismo trabajo de impresión.
pub fn print_default_silent(
    printer_name: Option<String>,
    png_base64: &str,
    copies: Option<u32>,
    orientation: Option<String>,
    width_mm: Option<f64>,
    height_mm: Option<f64>,
) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(png_base64)
        .map_err(|e| format!("Imagen base64 inválida: {e}"))?;
    let img = image::load_from_memory(&bytes)
        .map_err(|e| format!("No se pudo decodificar la imagen: {e}"))?
        .to_rgb8();

    let printer = match printer_name {
        Some(p) => p,
        None => get_default_printer_name()?,
    };

    let devmode = build_devmode(&printer, orientation.as_deref(), width_mm, height_mm)?;
    print_bitmap(&printer, devmode, &img, copies.unwrap_or(1), None)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintDialogOutcome {
    pub printed: bool,
    pub printer: Option<String>,
}

struct PrintDialogChoice {
    cancelled: bool,
    printer_name: String,
    copies: u32,
}

/// Arma el bloque DEVNAMES que PrintDlgW espera para abrir con una
/// impresora concreta ya preseleccionada (si no se le da nada, Windows
/// preselecciona la predeterminada del sistema por su cuenta).
fn build_devnames(printer: &PrinterInfo) -> Result<HGLOBAL, String> {
    let driver = to_wide(&printer.driver);
    let device = to_wide(&printer.name);
    let port = to_wide(&printer.port);
    let header_words = (std::mem::size_of::<DEVNAMES>() / 2) as u16;
    let total_words = header_words as usize + driver.len() + device.len() + port.len();

    let hmem = unsafe { GlobalAlloc(GMEM_MOVEABLE | GMEM_ZEROINIT, total_words * 2) }
        .map_err(|e| format!("No se pudo reservar memoria: {e}"))?;
    let ptr = unsafe { GlobalLock(hmem) } as *mut u16;
    if ptr.is_null() {
        let _ = unsafe { GlobalFree(Some(hmem)) };
        return Err("No se pudo preparar la selección de impresora".to_string());
    }

    let driver_offset = header_words;
    let device_offset = driver_offset + driver.len() as u16;
    let output_offset = device_offset + device.len() as u16;
    unsafe {
        let header = ptr as *mut DEVNAMES;
        (*header).wDriverOffset = driver_offset;
        (*header).wDeviceOffset = device_offset;
        (*header).wOutputOffset = output_offset;
        (*header).wDefault = 0;
        std::ptr::copy_nonoverlapping(driver.as_ptr(), ptr.add(driver_offset as usize), driver.len());
        std::ptr::copy_nonoverlapping(device.as_ptr(), ptr.add(device_offset as usize), device.len());
        std::ptr::copy_nonoverlapping(port.as_ptr(), ptr.add(output_offset as usize), port.len());
    }
    let _ = unsafe { GlobalUnlock(hmem) };
    Ok(hmem)
}

fn read_devnames_device(hmem: HGLOBAL) -> Result<String, String> {
    if hmem.is_invalid() {
        return Err("No se eligió ninguna impresora".to_string());
    }
    let ptr = unsafe { GlobalLock(hmem) } as *const u16;
    if ptr.is_null() {
        return Err("No se pudo leer la impresora elegida".to_string());
    }
    let header = unsafe { &*(ptr as *const DEVNAMES) };
    let device_ptr = unsafe { ptr.add(header.wDeviceOffset as usize) };
    let name = wide_to_string(PWSTR(device_ptr as *mut u16));
    let _ = unsafe { GlobalUnlock(hmem) };
    Ok(name)
}

/// Muestra el diálogo NATIVO de impresión de Windows (PrintDlgW — el común
/// de todo el sistema, no el del navegador) para que el operador elija a
/// qué impresora mandar la foto y cuántas copias, o cancele.
fn show_print_dialog(preferred_printer: Option<String>) -> Result<PrintDialogChoice, String> {
    let preselected = match preferred_printer.filter(|n| !n.is_empty()) {
        Some(name) => {
            let printers = list_printers()?;
            printers.into_iter().find(|p| p.name == name)
        }
        None => None,
    };

    let mut pd = PRINTDLGW {
        lStructSize: std::mem::size_of::<PRINTDLGW>() as u32,
        Flags: PD_NOPAGENUMS | PD_HIDEPRINTTOFILE,
        nMinPage: 1,
        nMaxPage: 1,
        nCopies: 1,
        ..Default::default()
    };
    if let Some(printer) = &preselected {
        pd.hDevNames = build_devnames(printer)?;
    }

    let ok = unsafe { PrintDlgW(&mut pd) }.as_bool();

    if !ok {
        if !pd.hDevNames.is_invalid() {
            let _ = unsafe { GlobalFree(Some(pd.hDevNames)) };
        }
        if !pd.hDevMode.is_invalid() {
            let _ = unsafe { GlobalFree(Some(pd.hDevMode)) };
        }
        return Ok(PrintDialogChoice {
            cancelled: true,
            printer_name: String::new(),
            copies: 1,
        });
    }

    let printer_name = read_devnames_device(pd.hDevNames);
    let copies = pd.nCopies.max(1) as u32;

    if !pd.hDevNames.is_invalid() {
        let _ = unsafe { GlobalFree(Some(pd.hDevNames)) };
    }
    if !pd.hDevMode.is_invalid() {
        let _ = unsafe { GlobalFree(Some(pd.hDevMode)) };
    }

    Ok(PrintDialogChoice {
        cancelled: false,
        printer_name: printer_name?,
        copies,
    })
}

/// "Microsoft Print to PDF", "Microsoft XPS Document Writer" y similares
/// son impresoras que escriben a un archivo en vez de papel — Windows las
/// distingue por el puerto: "PORTPROMPT:" (pregunta la ruta al imprimir
/// desde el flujo normal) o "FILE:". Si no le damos nosotros mismos una
/// ruta de salida, el trabajo se completa "bien" mientras no genera nada
/// visible — de ahí que pareciera fallar en silencio.
fn is_file_output_port(port: &str) -> bool {
    let p = port.to_uppercase();
    p.starts_with("PORTPROMPT") || p.starts_with("FILE:")
}

/// Pide al operador dónde guardar el PDF con el diálogo nativo "Guardar
/// como" de Windows. `Ok(None)` significa que canceló.
fn prompt_save_pdf_path(default_file_name: &str) -> Result<Option<String>, String> {
    const BUF_LEN: usize = 1024;
    let mut buf: Vec<u16> = vec![0; BUF_LEN];
    let default_wide = to_wide(default_file_name);
    let copy_len = default_wide.len().min(BUF_LEN);
    buf[..copy_len].copy_from_slice(&default_wide[..copy_len]);

    // Doble NUL al final de cada cadena y al final de la lista, como pide
    // la API: "Descripción\0*.patrón\0\0".
    let filter = to_wide("Documento PDF\0*.pdf\0");

    let mut ofn = OPENFILENAMEW {
        lStructSize: std::mem::size_of::<OPENFILENAMEW>() as u32,
        lpstrFilter: PCWSTR(filter.as_ptr()),
        lpstrFile: PWSTR(buf.as_mut_ptr()),
        nMaxFile: BUF_LEN as u32,
        lpstrDefExt: windows::core::w!("pdf"),
        Flags: OFN_OVERWRITEPROMPT | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR | OFN_HIDEREADONLY,
        ..Default::default()
    };

    let ok = unsafe { GetSaveFileNameW(&mut ofn) }.as_bool();
    if !ok {
        return Ok(None);
    }

    let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    Ok(Some(String::from_utf16_lossy(&buf[..len])))
}

/// Flujo completo "profesional": abre el diálogo nativo de Windows para que
/// el operador elija impresora/copias, y con esa elección dibuja la foto
/// con GDI directo al tamaño de papel exacto pedido (cover-fit, sin
/// bordes). Si el operador cancela el diálogo, no se considera un error.
/// Si eligió "Microsoft Print to PDF" (o similar), antes pregunta dónde
/// guardar el archivo — sin eso, esas impresoras no generan nada.
pub fn print_with_native_dialog(
    png_base64: &str,
    preferred_printer: Option<String>,
    orientation: Option<String>,
    width_mm: Option<f64>,
    height_mm: Option<f64>,
) -> Result<PrintDialogOutcome, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(png_base64)
        .map_err(|e| format!("Imagen base64 inválida: {e}"))?;
    let img = image::load_from_memory(&bytes)
        .map_err(|e| format!("No se pudo decodificar la imagen: {e}"))?
        .to_rgb8();

    let choice = show_print_dialog(preferred_printer)?;
    if choice.cancelled {
        return Ok(PrintDialogOutcome {
            printed: false,
            printer: None,
        });
    }

    let printers = list_printers()?;
    let chosen = printers.iter().find(|p| p.name == choice.printer_name);
    let output_file = match chosen {
        Some(p) if is_file_output_port(&p.port) => {
            match prompt_save_pdf_path("Foto Birdcam.pdf")? {
                Some(path) => Some(path),
                None => {
                    // Canceló el "Guardar como" — igual que cancelar el
                    // diálogo de impresión, no es un error.
                    return Ok(PrintDialogOutcome {
                        printed: false,
                        printer: None,
                    });
                }
            }
        }
        _ => None,
    };

    let devmode = build_devmode(&choice.printer_name, orientation.as_deref(), width_mm, height_mm)?;
    print_bitmap(
        &choice.printer_name,
        devmode,
        &img,
        choice.copies,
        output_file.as_deref(),
    )?;

    Ok(PrintDialogOutcome {
        printed: true,
        printer: Some(choice.printer_name),
    })
}