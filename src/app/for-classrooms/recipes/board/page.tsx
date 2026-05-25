import type { Metadata } from "next";
import { RecipeBoard } from "./recipe-board";

export const metadata: Metadata = {
  title: "Green time board (preview)",
  description:
    "An ambient, projector-friendly green time menu for the class board. Kids pick a recipe off a calm, glowing wall, then make it at their desk. Preview build. No accounts, no tracking kids.",
  robots: { index: false, follow: false },
};

export default function RecipeBoardPage() {
  return <RecipeBoard />;
}
