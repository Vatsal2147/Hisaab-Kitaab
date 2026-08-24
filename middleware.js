import arcjet, { detectBot, shield } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
//createRouteMatcher will be deprecated in next release toh koi issue aaya toh issue hi theek hoga
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/account(.*)",
    "/transaction(.*)",

])

const aj = arcjet({
  key:process.env.ARCJET_KEY,
  rules:[
    shield({
      mode: 'LIVE'
    }),
    detectBot({
      mode: "LIVE",
      allow:[
        "CATEGORY:SEARCH_ENGINE", "GO_HTTP"
      ]
    })
  ]
})

export default clerkMiddleware(async (auth,req)=>{
    const{userId} = await auth();
    //if user not signed in and on any of the protected routes, then we automatically redirect them to the sign in page
    if(!userId && isProtectedRoute(req)){
         const{redirectToSignIn} = await auth();

         return redirectToSignIn();
    }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};