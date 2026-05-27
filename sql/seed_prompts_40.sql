-- Seed revised mindful prompts (19 per kind, 76 total), idempotent.
-- Safe to re-run: updates existing prompts by (kind, title), inserts missing ones,
-- deactivates retired prompts, and de-dupes active duplicates.

with seed(kind, title, body, step, is_active) as (
  values
    -- pause (11)
    ('pause', 'Window Scan', 'Look around wherever you are, or picture a place you know well, and find three still things and three things that move.', 'Take three slow breaths. On each breath out, softly name one of them.', true),
    ('pause', 'Five Sounds', 'Pause and listen for five different sounds around you.', 'Take one breath per sound and let your shoulders drop a little each time.', true),
    ('pause', 'Feet on Ground', 'Notice where your feet touch the floor right now.', 'Press your feet down for a count of three, then release. Repeat three times.', true),
    ('pause', 'Hand Warmth', 'Rub your hands together until they feel warm.', 'Place your warm hands on your cheeks or chest and take three calm breaths.', true),
    ('pause', 'Cloud Watching', 'Imagine one big, soft cloud drifting slowly across a wide blue sky.', 'Breathe in for four, out for four, and picture the cloud drifting gently by.', true),
    ('pause', 'Color Count', 'Pick one color and count how many things you can find in that color nearby.', 'After counting, close your eyes for one breath and open slowly.', true),
    ('pause', 'Tiny Stretch', 'Sit or stand tall and stretch your arms up like you are waking up.', 'Inhale as you reach, exhale as you lower. Do that three times.', true),
    ('pause', 'Body Weight', 'Sit quietly and notice the weight of your body in the chair or on the floor.', 'Take three slow breaths and feel yourself get a little heavier each time.', true),
    ('pause', 'Name and Breathe', 'Quietly name where you are and what time of day it is.', 'Take two slow breaths and remind yourself: I am here right now.', true),
    ('pause', 'Sip Pause', 'If you have water, take one small sip and notice the cool feeling. If not, just swallow once and notice the feeling.', 'Breathe in, hold for one second, then breathe out slowly.', true),
    ('pause', 'Warm or Cool', 'Notice whether your hands feel warm or cool right now.', 'Hold them together gently for three breaths and notice if anything changes.', true),
    ('pause', 'Finger Trace', 'Hold one hand open like a star. Use a finger from your other hand to slowly trace up and down each finger.', 'Breathe in as you trace up a finger, and out as you trace down. Go all the way across your hand.', true),
    ('pause', 'Find Your Heartbeat', 'Place a hand on your chest and see if you can feel or sense your heartbeat.', 'Take three slow breaths and notice if your heartbeat settles a little.', true),
    ('pause', 'Wall Push', 'Place both hands flat against a wall and push like you are trying to move it.', 'Push for a slow count of five, then stop and feel your arms go loose. Do it twice.', true),
    ('pause', 'One Texture', 'Touch something near you -- your sleeve, the desk, your own hands -- and notice if it feels smooth, bumpy, soft, or rough.', 'Run a finger over it slowly for three calm breaths.', true),
    ('pause', 'Cool In, Warm Out', 'Breathe in through your nose and notice the air feels cool. Breathe out and notice it feels a little warmer.', 'Do that three times, slow and quiet.', true),
    ('pause', 'Square Breath', 'Picture drawing a square in the air with your eyes or a finger.', 'Breathe in for four along one side, hold for four, out for four, hold for four. Trace one full square.', true),
    ('pause', 'Shoulder Drop', 'Lift your shoulders up toward your ears as high as they will go.', 'Hold for one breath, then let them drop all the way down on a long breath out. Do it twice.', true),
    ('pause', 'Look Far', 'Rest your eyes on the farthest thing you can see, or close them and picture a wide-open view, like the sea or a big sky.', 'Rest there for three slow breaths and let your face soften.', true),

    -- letting-go (11)
    ('letting-go', 'Balloon Release', 'Imagine your worry tied to a balloon string in your hand.', 'With a long exhale, picture letting go of the string and the balloon floating away.', true),
    ('letting-go', 'Leaf on Stream', 'Picture your thought resting on a leaf in a gentle stream.', 'Take three breaths and picture the leaf floating farther away with each one.', true),
    ('letting-go', 'Shelf for Later', 'Think of one thing you cannot solve right now.', 'Place it on an imaginary shelf for later and whisper: Not now.', true),
    ('letting-go', 'Snow Globe', 'Imagine your mind is a snow globe that got shaken.', 'Sit still for three breaths and picture the flakes settling slowly down.', true),
    ('letting-go', 'Loose Knot', 'Imagine your worry is a knot in a piece of string.', 'Take three slow breaths. With each breath out, picture the knot loosening just a little.', true),
    ('letting-go', 'Pocket Worry', 'Imagine putting your worry into a tiny pocket outside your body.', 'Zip the pocket, take two breaths, and return to what is in front of you.', true),
    ('letting-go', 'Tape Note', 'Pretend your worry is written on a sticky note.', 'Peel it off your mind, fold it up, and tuck it in your pocket for later. Take two breaths.', true),
    ('letting-go', 'Remote Control', 'Picture your thought as a loud TV channel.', 'Use an imaginary remote to lower the volume while breathing out.', true),
    ('letting-go', 'Rain Passing', 'Imagine your worry as a rain cloud passing overhead.', 'Take three breaths and picture the cloud drifting past you.', true),
    ('letting-go', 'Backpack Unload', 'Think of one heavy thought you have been carrying.', 'Set it down beside you for this moment and feel your shoulders lighten.', true),
    ('letting-go', 'Loosen Up', 'Notice any tension in your jaw, fists, or shoulders right now.', 'Take a slow breath in. As you breathe out, unclench whatever feels tight. Do this three times.', true),
    ('letting-go', 'Worry Bubble', 'Imagine putting your worry inside a soap bubble.', 'On a long breath out, picture the bubble floating up and popping softly into nothing.', true),
    ('letting-go', 'Wave Wash', 'Picture your worry written in the sand at the edge of the sea.', 'Take three breaths and picture a gentle wave washing the words smooth.', true),
    ('letting-go', 'Squeeze and Drop', 'Squeeze your hands into tight fists and hold all your stress in there.', 'Count to five, then open your hands fast on a breath out and let it all go.', true),
    ('letting-go', 'Set the Stone Down', 'Imagine your worry is a heavy stone you have been carrying.', 'Breathe in. As you breathe out, picture setting the stone gently on the ground.', true),
    ('letting-go', 'Paper Boat', 'Picture your worry folded into a little paper boat on a stream.', 'Breathe out slowly three times and picture it drifting away and out of sight.', true),
    ('letting-go', 'Big Sigh', 'Take a normal breath in, then sneak a tiny bit more air on top.', 'Let it all out with a long, loud sigh. Do that two or three times and feel your chest loosen.', true),
    ('letting-go', 'Melting Ice', 'Notice any tight or frozen feeling in your body, maybe in your chest or stomach.', 'Breathe slowly and imagine it melting like ice in the sun, getting softer with each breath.', true),
    ('letting-go', 'Close the Tabs', 'Imagine your mind has too many tabs open, like a crowded screen.', 'On each slow breath out, picture closing one tab until the screen feels calm.', true),

    -- reflect (11)
    ('reflect', 'Small Win Replay', 'Remember one thing you handled today, even if it was tiny.', 'Replay it in your mind for ten seconds and notice how it felt.', true),
    ('reflect', 'Better Than Expected', 'What went a little better today than you thought it would?', 'Take one deep breath and say: That counted.', true),
    ('reflect', 'Helpful Moment', 'Think of a moment someone helped you, even in a small way.', 'Breathe in gratitude, breathe out tension.', true),
    ('reflect', 'Brave Thing', 'Name one brave thing you did today -- even something small like speaking up, trying something new, or just getting through a hard moment.', 'Place a hand on your chest and say: I did something hard.', true),
    ('reflect', 'Laugh Memory', 'Find one moment that made you smile or laugh today.', 'Hold that memory for three breaths.', true),
    ('reflect', 'Calm Spot', 'Remember one moment today that felt a little calm.', 'Picture where you were and what you noticed around you.', true),
    ('reflect', 'Kept Going', 'Think of a time you wanted to quit but kept going.', 'Take a slow breath and thank yourself for not giving up.', true),
    ('reflect', 'Kind Choice', 'Name one kind choice you made today.', 'Breathe in and out once, and let that choice feel real.', true),
    ('reflect', 'Learning Moment', 'What did you learn today, even a tiny thing?', 'Say it quietly and take one steady breath.', true),
    ('reflect', 'Good Ending', 'Name one good thing that happened today so far, or that you are looking forward to.', 'Close your eyes and hold that thought for two breaths.', true),
    ('reflect', 'Hard Day', 'If today was a tough one, that is okay. Hard days are real.', 'Take three breaths and say quietly: I got through today. That is enough.', true),
    ('reflect', 'Three Small Goods', 'Think of three small good things from today, like a snack, a song, or a smile.', 'Name them in your mind, one for each slow breath.', true),
    ('reflect', 'Something Soon', 'Think of one thing coming up that you feel okay or even a little excited about.', 'Take a slow breath and let yourself look forward to it for a moment.', true),
    ('reflect', 'One Strength', 'Name one thing you are good at, even something quiet like being a good listener.', 'Breathe in and let yourself feel proud of that for three seconds.', true),
    ('reflect', 'Name the Feeling', 'Notice what you are feeling right now and try to give it one word.', 'Take a slow breath and say to yourself: it is okay to feel this.', true),
    ('reflect', 'Someone in My Corner', 'Think of one person who is glad you exist.', 'Picture their face for three breaths and let that feel real.', true),
    ('reflect', 'Trying Counts', 'Think of something you put effort into today, even if it did not go perfectly.', 'Place a hand on your chest and say: trying counts.', true),
    ('reflect', 'What Helped Today', 'Think of one thing that helped you feel a little better today.', 'Take one slow breath and remember you can come back to that thing again.', true),
    ('reflect', 'Tomorrow Is New', 'Remember that tomorrow is a fresh start, no matter how today went.', 'Breathe out slowly and let go of one thing from today you do not need to keep.', true),

    -- kindness (11)
    ('kindness', 'Wish a Friend Well', 'Think of a friend who might need a boost today.', 'Breathe out and send this wish: I hope you feel supported.', true),
    ('kindness', 'Kindness Ripple', 'Picture one kind action spreading out like ripples in water.', 'Take three breaths and imagine the ripples reaching others.', true),
    ('kindness', 'Quiet Thank You', 'Think of someone who helped you recently.', 'Say a quiet thank you in your mind while breathing slowly.', true),
    ('kindness', 'Gentle Words', 'Pick one person and think of one kind sentence you could tell them.', 'Repeat that sentence silently on your next exhale.', true),
    ('kindness', 'Same Team', 'Think of someone you find hard to get along with sometimes.', 'Take a breath and remember: You are both learning and trying.', true),
    ('kindness', 'Kind Eyes', 'Imagine looking at someone with kind eyes instead of judging eyes.', 'Breathe out slowly and soften your face.', true),
    ('kindness', 'Future Kindness', 'Choose one small kind thing you can do later today.', 'Take one deep breath and commit to doing it.', true),
    ('kindness', 'Send Calm', 'Think of someone who seems stressed right now.', 'On each exhale, send: May you feel calm.', true),
    ('kindness', 'Self Kindness', 'Turn kindness toward yourself for one minute.', 'Say: I am still learning, and that is okay.', true),
    ('kindness', 'Circle of Care', 'Imagine a small circle with you and people you care about.', 'Breathe slowly and wish everyone in the circle a kind, easy day.', true),
    ('kindness', 'You Deserved That', 'Think of one kind thing someone has said to you or done for you recently -- even something small.', 'Take a breath and let yourself actually believe it for a moment. You deserved that kindness.', true),
    ('kindness', 'May All Be Well', 'Picture the people near you right now, even ones you do not know well.', 'On each breath out, send a quiet wish: I hope you have a good day.', true),
    ('kindness', 'Thank Your Body', 'Think of one thing your body did for you today, like walking, resting, or breathing.', 'Place a hand there and take three breaths to say thank you.', true),
    ('kindness', 'Be the Helper', 'Remember a time when someone helping you felt good.', 'Take a breath and pick one small way you could help someone today.', true),
    ('kindness', 'Let Yourself Off', 'Think of one small thing you have been hard on yourself about.', 'Take a slow breath and say: I am allowed to make mistakes.', true),
    ('kindness', 'Gentle to Anything', 'Think of an animal, a plant, or a person you can be gentle with.', 'Breathe slowly and send them one kind thought.', true),
    ('kindness', 'Warm Wish Home', 'Think of someone you live with or care about at home.', 'On your next breath out, send them this wish: I hope you feel loved.', true),
    ('kindness', 'Cheer Yourself On', 'Imagine a friend who always believes in you.', 'Hear them say one kind, encouraging thing to you, and breathe in to let it land.', true),
    ('kindness', 'Kindness Jar', 'Picture a jar where you keep every kind thing that has happened to you.', 'Add one kind moment to the jar in your mind and take a slow breath.', true)
),
updated as (
  update prompts p
  set
    body = s.body,
    step = s.step,
    is_active = s.is_active
  from seed s
  where p.kind = s.kind
    and p.title = s.title
  returning p.id
)
insert into prompts (kind, title, body, step, is_active)
select s.kind, s.title, s.body, s.step, s.is_active
from seed s
where not exists (
  select 1
  from prompts p
  where p.kind = s.kind
    and p.title = s.title
);

-- Retire superseded prompts.
update prompts
set is_active = false
where (kind, title) in (
  ('pause', 'Blink Reset'),
  ('letting-go', 'Traffic Light')
);

-- Strict mode: keep only the curated set active for these four kinds.
with curated(kind, title) as (
  values
    -- pause
    ('pause', 'Window Scan'),
    ('pause', 'Five Sounds'),
    ('pause', 'Feet on Ground'),
    ('pause', 'Hand Warmth'),
    ('pause', 'Cloud Watching'),
    ('pause', 'Color Count'),
    ('pause', 'Tiny Stretch'),
    ('pause', 'Body Weight'),
    ('pause', 'Name and Breathe'),
    ('pause', 'Sip Pause'),
    ('pause', 'Warm or Cool'),
    ('pause', 'Finger Trace'),
    ('pause', 'Find Your Heartbeat'),
    ('pause', 'Wall Push'),
    ('pause', 'One Texture'),
    ('pause', 'Cool In, Warm Out'),
    ('pause', 'Square Breath'),
    ('pause', 'Shoulder Drop'),
    ('pause', 'Look Far'),

    -- letting-go
    ('letting-go', 'Balloon Release'),
    ('letting-go', 'Leaf on Stream'),
    ('letting-go', 'Shelf for Later'),
    ('letting-go', 'Snow Globe'),
    ('letting-go', 'Loose Knot'),
    ('letting-go', 'Pocket Worry'),
    ('letting-go', 'Tape Note'),
    ('letting-go', 'Remote Control'),
    ('letting-go', 'Rain Passing'),
    ('letting-go', 'Backpack Unload'),
    ('letting-go', 'Loosen Up'),
    ('letting-go', 'Worry Bubble'),
    ('letting-go', 'Wave Wash'),
    ('letting-go', 'Squeeze and Drop'),
    ('letting-go', 'Set the Stone Down'),
    ('letting-go', 'Paper Boat'),
    ('letting-go', 'Big Sigh'),
    ('letting-go', 'Melting Ice'),
    ('letting-go', 'Close the Tabs'),

    -- reflect
    ('reflect', 'Small Win Replay'),
    ('reflect', 'Better Than Expected'),
    ('reflect', 'Helpful Moment'),
    ('reflect', 'Brave Thing'),
    ('reflect', 'Laugh Memory'),
    ('reflect', 'Calm Spot'),
    ('reflect', 'Kept Going'),
    ('reflect', 'Kind Choice'),
    ('reflect', 'Learning Moment'),
    ('reflect', 'Good Ending'),
    ('reflect', 'Hard Day'),
    ('reflect', 'Three Small Goods'),
    ('reflect', 'Something Soon'),
    ('reflect', 'One Strength'),
    ('reflect', 'Name the Feeling'),
    ('reflect', 'Someone in My Corner'),
    ('reflect', 'Trying Counts'),
    ('reflect', 'What Helped Today'),
    ('reflect', 'Tomorrow Is New'),

    -- kindness
    ('kindness', 'Wish a Friend Well'),
    ('kindness', 'Kindness Ripple'),
    ('kindness', 'Quiet Thank You'),
    ('kindness', 'Gentle Words'),
    ('kindness', 'Same Team'),
    ('kindness', 'Kind Eyes'),
    ('kindness', 'Future Kindness'),
    ('kindness', 'Send Calm'),
    ('kindness', 'Self Kindness'),
    ('kindness', 'Circle of Care'),
    ('kindness', 'You Deserved That'),
    ('kindness', 'May All Be Well'),
    ('kindness', 'Thank Your Body'),
    ('kindness', 'Be the Helper'),
    ('kindness', 'Let Yourself Off'),
    ('kindness', 'Gentle to Anything'),
    ('kindness', 'Warm Wish Home'),
    ('kindness', 'Cheer Yourself On'),
    ('kindness', 'Kindness Jar')
)
update prompts p
set is_active = false
where p.kind in ('pause', 'letting-go', 'reflect', 'kindness')
  and p.is_active = true
  and not exists (
    select 1
    from curated c
    where c.kind = p.kind
      and c.title = p.title
  );

-- Keep only one active row per (kind, title), newest first.
with ranked as (
  select
    id,
    row_number() over (
      partition by kind, title
      order by created_at desc, id desc
    ) as rn
  from prompts
  where is_active = true
    and kind in ('pause', 'letting-go', 'reflect', 'kindness')
)
update prompts p
set is_active = false
from ranked r
where p.id = r.id
  and r.rn > 1;
