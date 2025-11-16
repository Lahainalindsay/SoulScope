import type { AppProps } from "next/app";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps & { pageProps: { initialSession?: any } }) {
  const { initialSession, ...rest } = pageProps;
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      <Component {...rest} />
    </SessionContextProvider>
  );
}
