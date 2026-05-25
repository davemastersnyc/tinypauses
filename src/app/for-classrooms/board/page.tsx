import type { Metadata } from "next";
import { BoardMode } from "./board-mode";

export const metadata: Metadata = {
  title: "Classroom Brain Break (preview)",
  description:
    "A hands-free, board-friendly Brain Break for the whole class. Put it on the smartboard, pick where the room is, and lead a 90-second reset. Preview build. No student accounts, no tracking.",
  robots: { index: false, follow: false },
};

export default function BoardPage() {
  return <BoardMode />;
}
