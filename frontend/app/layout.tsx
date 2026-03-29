import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "SkillsExchange — Learn & Teach Skills",
	description: "Connect with others to exchange skills, schedule sessions, and grow together.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
				<AuthProvider>
					<ToastProvider>
						<Navbar />
						<main className="flex-1">{children}</main>
					</ToastProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
