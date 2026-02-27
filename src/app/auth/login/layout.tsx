import type { Metadata } from 'next';
import Footer from '../../Footer';

export const metadata: Metadata = {
  title: "Login — SayYes — A weekly connection for couples who choose to stay together",
  description: "Sign in to your weekly connection space. SayYes is a private, intentional space designed to help couples maintain their bond through a simple weekly rhythm and relationship check-ins.",
  alternates: {
    canonical: '/auth/login',
  },
  openGraph: {
    title: "Login — SayYes — A weekly connection for couples who choose to stay together",
    description: "Sign in to your weekly connection space. SayYes is a private, intentional space designed to help couples maintain their bond through a simple weekly rhythm and relationship check-ins.",
    url: '/auth/login',
    type: 'website',
    images: ["https://sayyesapp.com/icon.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login — SayYes — A weekly connection for couples who choose to stay together",
    description: "Sign in to your weekly connection space. SayYes is a private, intentional space designed to help couples maintain their bond through a simple weekly rhythm and relationship check-ins.",
    images: ["https://sayyesapp.com/icon.svg"],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        {children}
      </div>
      <Footer />
    </div>
  );
}
