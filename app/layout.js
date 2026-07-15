import "./globals.css";

export const metadata = {
  title: "Lịch Xe Cao Lãnh",
  description: "Sắp xếp tuyến xe nội bộ"
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
