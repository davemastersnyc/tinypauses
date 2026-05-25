// Shared recipe data for both the printable card sheet (/for-classrooms/recipes)
// and the ambient projected board menu (/for-classrooms/recipes/board).
// Each recipe is make-then-rest: a creative beat that produces a small object,
// then a still beat spent with it. The rest step echoes the wording of the
// matching Tiny Pauses prompt the app already ships (seed_prompts_40).

export type Kind = "pause" | "letting-go" | "reflect" | "kindness";

export const kindMeta: Record<
  Kind,
  { label: string; color: string; ink: string }
> = {
  pause: { label: "Pause", color: "#66cccc", ink: "#0b6b6b" },
  "letting-go": { label: "Letting go", color: "#7edfaa", ink: "#1f7a4d" },
  reflect: { label: "Reflect", color: "#ffd84a", ink: "#8a6a00" },
  kindness: { label: "Kindness", color: "#f9a36a", ink: "#9a4a16" },
};

export type Recipe = {
  title: string;
  kind: Kind;
  need: string;
  make: string;
  rest: string;
  makes: string;
};

export const recipes: Recipe[] = [
  {
    title: "Cloud Watching",
    kind: "pause",
    need: "paper, a pencil",
    make: "Draw a few clouds across your paper. Any shapes you like, soft and slow.",
    rest: "Pick your favorite. Breathe in for four, out for four, and watch it drift by in your mind.",
    makes: "a sky to rest your eyes on",
  },
  {
    title: "Square Breath",
    kind: "pause",
    need: "paper, a pencil",
    make: "Draw one big square. Go over the four lines a few times, slow.",
    rest: "Now trace it with just your eyes: in for four up one side, hold four, out for four down, hold four. Skip the holds and just breathe if that feels better.",
    makes: "a shape that slows you down",
  },
  {
    title: "Color Count",
    kind: "pause",
    need: "paper, a colored pencil if you have one",
    make: "Pick one color. Hunt for it around the room and draw a small dot for each thing you find.",
    rest: "Look at your row of dots. Close your eyes for one slow breath, then open them slowly.",
    makes: "a calmer set of eyes",
  },
  {
    title: "Paper Boat",
    kind: "letting-go",
    need: "a small square of paper",
    make: "Fold a little paper boat, or draw one. Quietly give it one worry to carry, just for you.",
    rest: "Set it in front of you. Breathe out slowly three times and watch it drift away and out of sight.",
    makes: "one worry, sailing off",
  },
  {
    title: "Snow Globe",
    kind: "letting-go",
    need: "paper, a pencil",
    make: "Draw a snow globe. Fill it with dots for all the flakes swirling around in there.",
    rest: "Sit still for three breaths and watch the flakes settle to the bottom.",
    makes: "a settled snow globe",
  },
  {
    title: "Leaf on a Stream",
    kind: "letting-go",
    need: "paper, a pencil",
    make: "Draw a stream across your paper and one leaf floating on it. Rest a thought on the leaf, just for you.",
    rest: "Take three breaths. Each breath, picture the leaf floating a little farther away.",
    makes: "a thought, floating off",
  },
  {
    title: "Small Win",
    kind: "reflect",
    need: "paper, a pencil",
    make: "Draw one thing you handled today, even a tiny one.",
    rest: "Look at your drawing and replay the moment for ten slow seconds. Notice how it felt.",
    makes: "one good moment, kept",
  },
  {
    title: "Kindness Jar",
    kind: "kindness",
    need: "paper, a pencil",
    make: "Draw a jar. Inside it, draw or write one kind thing, something someone did for you, or you did for someone.",
    rest: "Add it to the jar in your mind and take one slow breath. It stays in there.",
    makes: "one kindness, kept",
  },
];
