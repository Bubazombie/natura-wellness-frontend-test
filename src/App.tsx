import { AppNav, type Part } from "./AppNav";
import { SubscriptionCard } from "./part-a/SubscriptionCard";
import { BuyBox } from "./part-b/BuyBox";

const part: Part = new URLSearchParams(window.location.search).get("part") === "b" ? "b" : "a";

export function App() {
  return (
    <>
      <AppNav current={part} />
      <main>{part === "a" ? <SubscriptionCard /> : <BuyBox />}</main>
    </>
  );
}
