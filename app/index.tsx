/**
 * Root index - Redireciona para a tela de Landing
 * 
 * O Expo Router usa file-based routing e (tabs)/index.tsx é tratado como
 * a rota padrão. Este arquivo garante que a rota "/" sempre redirecione
 * para "/landing", forçando o fluxo: Landing → Login → Home.
 */
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/landing" />;
}
