import type { AppProps } from "next/app";
import Head from "next/head";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import "../styles/globals.css";
import "../styles/responsive.css";

export default function App({ Component, pageProps }: AppProps & { pageProps: { initialSession?: any } }) {
  const { initialSession, ...rest } = pageProps;
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Navbar />
      <Component {...rest} />
    </SessionContextProvider>
  );
}
