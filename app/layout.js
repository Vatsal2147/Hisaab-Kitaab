import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import {Toaster} from 'sonner';

const inter = Inter({subsets:["latin"]});



export const metadata = {
  title: "Hisaab Kitaab",
  description: "A one stop application for all your financial needs",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html
      lang="en"
      className={`${inter.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header/>
        <main className="min-h-screen "> 
          {children}

        </main>
       <Toaster richColors ></Toaster>
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>
              Made with ❤️ by Vatsal | Hisaab Kitaab © 
            </p>
          </div>
        </footer>
        </body>
    </html>
    </ClerkProvider>
  );
}
