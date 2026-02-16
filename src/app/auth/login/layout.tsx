import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login — SayYes",
  description: "Sign in to your weekly connection space. SayYes helps couples stay intentional and aligned.",
  alternates: {
    canonical: '/auth/login',
  },
  openGraph: {
    title: "Login — SayYes",
    description: "Sign in to your weekly connection space. SayYes helps couples stay intentional and aligned.",
    url: '/auth/login',
    type: 'website',
    images: ["https://sayyesapp.com/icon.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login — SayYes",
    description: "Sign in to your weekly connection space. SayYes helps couples stay intentional and aligned.",
    images: ["https://sayyesapp.com/icon.svg"],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
