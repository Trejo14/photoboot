use base64::Engine;
use serde::Serialize;
use windows::core::{Error, PCWSTR, PWSTR};
use windows::Win32::Graphics::Gdi::{
    CreateDCW, DeleteDC, GetDeviceCaps, StretchDIBits, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
    DIB_RGB_COLORS, HORZRES, SRCCOPY, VERTRES,
};
use windows::Win32::Graphics::Printing::{
    ClosePrinter, EndDocPrinter, EndPagePrinter, EnumPrintersW, GetDefaultPrinterW, OpenPrinterW,
    StartDocPrinterW, StartPagePrinter, WritePrinter, DOC_INFO_1W, PRINTER_ALL_ACCESS,
    PRINTER_DEFAULTSW, PRINTER_ENUM_LOCAL, PRINTER_HANDLE, PRINTER_INFO_2W,
};
use windows::Win32::Storage::Xps::{EndDoc, EndPage, StartDocW, StartPage, DOCINFOW};

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

pub fn print_thermal(printer_name: Option<String>, png_base64: &str) -> Result<(), String> {
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
    send_raw(&printer, &escpos)
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

/// Imprime en la impresora predeterminada (no térmica) usando GDI directo,
/// sin mostrar el diálogo de impresión de Windows — para que los invitados
/// del evento no vean esa pantalla.
pub fn print_default_silent(printer_name: Option<String>, png_base64: &str) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(png_base64)
        .map_err(|e| format!("Imagen base64 inválida: {e}"))?;
    let img = image::load_from_memory(&bytes)
        .map_err(|e| format!("No se pudo decodificar la imagen: {e}"))?
        .to_rgb8();
    let (img_w, img_h) = (img.width(), img.height());

    let printer = match printer_name {
        Some(p) => p,
        None => get_default_printer_name()?,
    };

    let driver = to_wide("WINSPOOL");
    let device = to_wide(&printer);
    let hdc = unsafe { CreateDCW(PWSTR(driver.as_ptr() as *mut u16), PWSTR(device.as_ptr() as *mut u16), PWSTR(std::ptr::null_mut()), None) };
    if hdc.is_invalid() {
        return Err(format!("No se pudo abrir la impresora \"{printer}\""));
    }

    let result = (|| -> Result<(), String> {
        let doc_name = to_wide("Cabina Photobooth");
        let doc_info = DOCINFOW {
            cbSize: std::mem::size_of::<DOCINFOW>() as i32,
            lpszDocName: PCWSTR(doc_name.as_ptr()),
            lpszOutput: PCWSTR::null(),
            lpszDatatype: PCWSTR::null(),
            fwType: 0,
        };

        if unsafe { StartDocW(hdc, &doc_info) } <= 0 {
            return Err(format!("No se pudo iniciar el trabajo de impresión: {}", Error::from_win32()));
        }
        if unsafe { StartPage(hdc) } <= 0 {
            return Err(format!("No se pudo iniciar la página: {}", Error::from_win32()));
        }

        let page_w = unsafe { GetDeviceCaps(Some(hdc), HORZRES) }.max(1);
        let page_h = unsafe { GetDeviceCaps(Some(hdc), VERTRES) }.max(1);

        // Encaja la imagen dentro de la página conservando proporción, centrada.
        let scale = (page_w as f32 / img_w as f32).min(page_h as f32 / img_h as f32);
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
        if unsafe { EndDoc(hdc) } <= 0 {
            return Err(format!("No se pudo finalizar el trabajo de impresión: {}", Error::from_win32()));
        }
        Ok(())
    })();

    let _ = unsafe { DeleteDC(hdc) };
    result
}