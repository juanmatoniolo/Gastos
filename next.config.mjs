// next.config.mjs
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Forzar el uso de webpack para compatibilidad con next-pwa
	experimental: {
		turbo: false,
	},
};

export default withPWA(nextConfig);
