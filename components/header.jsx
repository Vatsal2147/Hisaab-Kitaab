import { SignInButton, UserButton, Show } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import React from "react";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";

const Header = async () => {
  await checkUser();
  return (
    <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo.png"}
            alt="logo"
            height={60}
            width={200}
            className="h-12 w-auto object-contain"
          />
        </Link>
        

        <div className="flex items-center space-x-4">
          <Show when="signed-in">
            <Link href="/dashboard">
             <Button variant="outline">
              <LayoutDashboard size={18}/>
              <span className="hidden md:inline">Dashboard</span> 
              {/* if width is smaller than some size, then hide the TEXT */}
             </Button>
            </Link>

             <Link href="/transaction/create" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
             <Button className="flex items-center gap-2">
              <PenBox size={18}/>
              <span className="hidden md:inline">Add Transaction</span> 
              {/* if width is smaller than some size, then hide the TEXT */}
             </Button>
            </Link>
          </Show>

          <Show when="signed-out">
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton appearance={{
              elements: {
                avatarBox: "w-40 h-40",
              },
            }}/>
          </Show>
        </div>
      </nav>
    </div>
  );
};

export default Header;
