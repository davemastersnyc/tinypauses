-- Seed 40 additional mindful prompts (10 per kind).
-- Run in Supabase SQL editor.

insert into prompts (kind, title, body, step, is_active)
values
  -- pause (10)
  ('pause', 'Window Scan', 'Look out a window or across the room and spot three still things and three moving things.', 'Take three slow breaths. On each exhale, softly name one thing you see.', true),
  ('pause', 'Five Sounds', 'Pause and listen for five different sounds around you.', 'Take one breath per sound and let your shoulders drop a little each time.', true),
  ('pause', 'Feet on Ground', 'Notice where your feet touch the floor right now.', 'Press your feet down for a count of three, then release. Repeat three times.', true),
  ('pause', 'Hand Warmth', 'Rub your hands together until they feel warm.', 'Place your warm hands on your cheeks or chest and take three calm breaths.', true),
  ('pause', 'Cloud Watching', 'Look up and find one cloud shape, or imagine one if you are indoors.', 'Breathe in for four, out for four, and picture the cloud drifting by.', true),
  ('pause', 'Color Count', 'Pick one color and count how many things you can find in that color nearby.', 'After counting, close your eyes for one breath and open slowly.', true),
  ('pause', 'Tiny Stretch', 'Sit or stand tall and stretch your arms up like you are waking up.', 'Inhale as you reach, exhale as you lower. Do that three times.', true),
  ('pause', 'Blink Reset', 'Soften your eyes and blink slowly five times.', 'With each blink, relax your jaw and forehead a little more.', true),
  ('pause', 'Name and Breathe', 'Quietly name where you are and what time of day it is.', 'Take two slow breaths and remind yourself: I am here right now.', true),
  ('pause', 'Sip Pause', 'If you have water, take one small sip and notice the cool feeling.', 'Breathe in, hold for one second, then breathe out slowly.', true),

  -- letting-go (10)
  ('letting-go', 'Balloon Release', 'Imagine your worry tied to a balloon string in your hand.', 'With a long exhale, picture letting go of the string and watching it float away.', true),
  ('letting-go', 'Leaf on Stream', 'Picture your thought resting on a leaf in a gentle stream.', 'Take three breaths and watch the leaf move farther away each breath.', true),
  ('letting-go', 'Shelf for Later', 'Think of one thing you cannot solve right now.', 'Place it on an imaginary shelf for later and whisper: Not now.', true),
  ('letting-go', 'Snow Globe', 'Imagine your mind is a snow globe that got shaken.', 'Sit still for three breaths and watch the flakes settle down.', true),
  ('letting-go', 'Traffic Light', 'Name one thought that feels like a red light in your head.', 'Say stop, breathe out slowly, and choose one green-light action for now.', true),
  ('letting-go', 'Pocket Worry', 'Imagine putting your worry into a tiny pocket outside your body.', 'Zip the pocket, take two breaths, and return to what is in front of you.', true),
  ('letting-go', 'Tape Note', 'Pretend your worry is written on a sticky note.', 'Peel it off your mind and place it on a wall for later.', true),
  ('letting-go', 'Remote Control', 'Picture your thought as a loud TV channel.', 'Use an imaginary remote to lower the volume while breathing out.', true),
  ('letting-go', 'Rain Passing', 'Imagine your worry as a rain cloud passing overhead.', 'Take three breaths and watch the cloud move past you.', true),
  ('letting-go', 'Backpack Unload', 'Think of one heavy thought you have been carrying.', 'Set it down beside you for this moment and feel your shoulders lighten.', true),

  -- reflect (10)
  ('reflect', 'Small Win Replay', 'Remember one thing you handled today, even if it was tiny.', 'Replay it in your mind for ten seconds and notice how it felt.', true),
  ('reflect', 'Better Than Expected', 'What went a little better today than you thought it would?', 'Take one deep breath and say: That counted.', true),
  ('reflect', 'Helpful Moment', 'Think of a moment someone helped you, even in a small way.', 'Breathe in gratitude, breathe out tension.', true),
  ('reflect', 'Brave Thing', 'Name one brave thing you did today.', 'Place a hand on your chest and say: I did something hard.', true),
  ('reflect', 'Laugh Memory', 'Find one moment that made you smile or laugh today.', 'Hold that memory for three breaths.', true),
  ('reflect', 'Calm Spot', 'Remember one moment today that felt a little calm.', 'Picture where you were and what you noticed around you.', true),
  ('reflect', 'Kept Going', 'Think of a time you wanted to quit but kept going.', 'Take a slow breath and thank yourself for not giving up.', true),
  ('reflect', 'Kind Choice', 'Name one kind choice you made today.', 'Breathe in and out once, and let that choice feel real.', true),
  ('reflect', 'Learning Moment', 'What did you learn today, even a tiny thing?', 'Say it quietly and take one steady breath.', true),
  ('reflect', 'Good Ending', 'Name one good thing about how your day ended.', 'Close your eyes and hold that thought for two breaths.', true),

  -- kindness (10)
  ('kindness', 'Wish a Friend Well', 'Think of a friend who might need a boost today.', 'Breathe out and send this wish: I hope you feel supported.', true),
  ('kindness', 'Kindness Ripple', 'Picture one kind action spreading out like ripples in water.', 'Take three breaths and imagine the ripples reaching others.', true),
  ('kindness', 'Quiet Thank You', 'Think of someone who helped you recently.', 'Say a quiet thank you in your mind while breathing slowly.', true),
  ('kindness', 'Gentle Words', 'Pick one person and think of one kind sentence you could tell them.', 'Repeat that sentence silently on your next exhale.', true),
  ('kindness', 'Same Team', 'Think of someone you argue with sometimes.', 'Take a breath and remember: You are both learning and trying.', true),
  ('kindness', 'Kind Eyes', 'Imagine looking at someone with kind eyes instead of judging eyes.', 'Breathe out slowly and soften your face.', true),
  ('kindness', 'Future Kindness', 'Choose one small kind thing you can do later today.', 'Take one deep breath and commit to doing it.', true),
  ('kindness', 'Send Calm', 'Think of someone who seems stressed right now.', 'On each exhale, send: May you feel calm.', true),
  ('kindness', 'Self Kindness', 'Turn kindness toward yourself for one minute.', 'Say: I am still learning, and that is okay.', true),
  ('kindness', 'Circle of Care', 'Imagine a small circle with you and people you care about.', 'Breathe slowly and wish everyone in the circle a steady day.', true);
