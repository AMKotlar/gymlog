import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const exercisesPath = join(__dirname, '../src/exercises.json')

const cues = [
  { name: 'Bench Press', cue_imagine: 'Pushing yourself away from the bar, not pushing the bar up', cue_feel: 'Chest, front shoulders and triceps', cue_avoid: 'Shoulders rolling forward or elbows flaring too wide' },
  { name: 'Incline Bench Press', cue_imagine: 'Pushing the bar up and slightly back toward your face', cue_feel: 'Upper chest and front delts', cue_avoid: 'Arching lower back or bouncing bar off chest' },
  { name: 'Decline Bench Press', cue_imagine: 'Pushing the bar straight up while keeping chest high', cue_feel: 'Lower chest and triceps', cue_avoid: 'Letting elbows flare or losing shoulder position' },
  { name: 'Dumbbell Chest Press', cue_imagine: 'Hugging a big tree as you press, dumbbells moving up and slightly together', cue_feel: 'Chest squeezing at the top', cue_avoid: 'Letting elbows drop too low or dumbbells too wide' },
  { name: 'Incline Dumbbell Press', cue_imagine: 'Pressing up and slightly inward like closing a tent above you', cue_feel: 'Upper chest', cue_avoid: 'Losing control at the bottom stretch' },
  { name: 'Chest Fly', cue_imagine: 'Wrapping arms around a barrel, elbows stay soft', cue_feel: 'Stretch and squeeze in chest', cue_avoid: 'Turning it into a press or locking elbows' },
  { name: 'Cable Chest Fly', cue_imagine: 'Hugging someone in front of you, hands meeting at chest height', cue_feel: 'Inner chest squeeze', cue_avoid: 'Pulling with arms or losing elbow angle' },
  { name: 'Pec Deck', cue_imagine: 'Bringing your elbows together like closing a book', cue_feel: 'Inner chest', cue_avoid: 'Shrugging shoulders or using momentum' },
  { name: 'Push Up', cue_imagine: 'Pushing the floor away while keeping your body as one rigid plank', cue_feel: 'Chest, triceps and core', cue_avoid: 'Hips sagging or elbows flaring past 45 degrees' },
  { name: 'Dips', cue_imagine: 'Leaning slightly forward and lowering until you feel your chest stretch', cue_feel: 'Lower chest and triceps', cue_avoid: 'Going too deep too fast or shrugging shoulders' },
  { name: 'Cable Crossover', cue_imagine: 'Drawing your hands together in an arc like scooping water', cue_feel: 'Full chest especially inner', cue_avoid: 'Dropping the elbows or losing arc shape' },
  { name: 'Smith Machine Bench Press', cue_imagine: 'Push yourself away from the bar, same as regular bench', cue_feel: 'Chest and triceps', cue_avoid: 'Over-relying on fixed path or flaring elbows' },
  { name: 'Lat Pulldown', cue_imagine: 'Driving your elbows down into your pockets', cue_feel: 'Sides of your back', cue_avoid: 'Pulling with hands or leaning too far back' },
  { name: 'Wide Grip Pulldown', cue_imagine: 'Driving elbows down and slightly outward', cue_feel: 'Outer lats and width of back', cue_avoid: 'Shrugging or using only arms' },
  { name: 'Close Grip Pulldown', cue_imagine: 'Pulling elbows straight down like pistons', cue_feel: 'Lower lats and mid back', cue_avoid: 'Leaning back excessively' },
  { name: 'Seated Cable Row', cue_imagine: 'Dragging handles toward your lower ribs, elbows travel back not up', cue_feel: 'Mid back and shoulder blades squeezing', cue_avoid: 'Shrugging, rounding forward or pulling too high' },
  { name: 'One Arm Dumbbell Row', cue_imagine: 'Pulling elbow toward your hip not toward the ceiling', cue_feel: 'Lat on the working side', cue_avoid: 'Twisting torso too much or losing shoulder position' },
  { name: 'Barbell Row', cue_imagine: 'Dragging the bar toward your belly button while keeping chest up', cue_feel: 'Entire back thickness', cue_avoid: 'Jerking with hips or rounding lower back' },
  { name: 'T-Bar Row', cue_imagine: 'Elbows back and chest stays up, same as barbell row', cue_feel: 'Mid and lower back', cue_avoid: 'Bouncing the weight or shrugging' },
  { name: 'Pull Up', cue_imagine: 'Pull shoulders down first then drive elbows toward ribs', cue_feel: 'Lats and upper back', cue_avoid: 'Kipping, half reps or shrugging at top' },
  { name: 'Chin Up', cue_imagine: 'Same as pull up but think biceps and lats working together', cue_feel: 'Lats and biceps', cue_avoid: 'Swinging or not reaching full extension at bottom' },
  { name: 'Assisted Pull Up', cue_imagine: 'Pulling chest toward bar not chin over bar', cue_feel: 'Lats and upper back', cue_avoid: 'Relying too much on assistance or doing half reps' },
  { name: 'Face Pull', cue_imagine: 'Pulling rope toward your forehead and spreading handles apart', cue_feel: 'Rear delts and rotator cuff', cue_avoid: 'Pulling too low or shrugging traps' },
  { name: 'Hyperextension', cue_imagine: 'Hinging at your hips like a door not rounding your spine', cue_feel: 'Lower back and glutes', cue_avoid: 'Hyperextending at top or rounding through movement' },
  { name: 'Deadlift', cue_imagine: 'Pushing the floor away rather than pulling the bar up', cue_feel: 'Entire posterior chain', cue_avoid: 'Rounding lower back or bar drifting from legs' },
  { name: 'Romanian Deadlift', cue_imagine: 'Closing a car door with your hips, pushing hips back', cue_feel: 'Hamstring stretch', cue_avoid: 'Squatting the movement or rounding back' },
  { name: 'Barbell Squat', cue_imagine: 'Sitting between your heels then pushing the floor away', cue_feel: 'Quads, glutes and core', cue_avoid: 'Knees caving, heels rising or excessive forward lean' },
  { name: 'Front Squat', cue_imagine: 'Sitting straight down like an elevator, elbows staying high', cue_feel: 'Quads and upper back', cue_avoid: 'Elbows dropping or forward lean' },
  { name: 'Goblet Squat', cue_imagine: 'Sitting down between your knees holding weight close to chest', cue_feel: 'Quads and glutes', cue_avoid: 'Caving knees or heels rising' },
  { name: 'Smith Machine Squat', cue_imagine: 'Pushing the platform away through mid-foot and heel', cue_feel: 'Quads and glutes', cue_avoid: 'Feet too far forward or locking knees' },
  { name: 'Hack Squat', cue_imagine: 'Pushing the sled away through your whole foot, chest staying up', cue_feel: 'Quads', cue_avoid: 'Knees caving or partial range' },
  { name: 'Leg Press', cue_imagine: 'Pushing the platform away through mid-foot, full range', cue_feel: 'Quads and glutes', cue_avoid: 'Locking knees or hips lifting off seat' },
  { name: 'Leg Extension', cue_imagine: 'Kicking the pad forward and slightly up, squeeze at top for one second', cue_feel: 'Front of thighs', cue_avoid: 'Swinging the weight or hips lifting' },
  { name: 'Leg Curl', cue_imagine: 'Pulling heels toward your glutes trying to cramp your hamstrings', cue_feel: 'Back of thighs', cue_avoid: 'Hips lifting off pad or using momentum' },
  { name: 'Stiff Leg Deadlift', cue_imagine: 'Hinging straight down feeling hamstrings pull', cue_feel: 'Hamstrings and lower back', cue_avoid: 'Bending knees too much or rounding spine' },
  { name: 'Hip Thrust', cue_imagine: 'Tucking belt buckle toward chin at top, driving through heels', cue_feel: 'Glutes', cue_avoid: 'Over-arching lower back or knees caving' },
  { name: 'Glute Bridge', cue_imagine: 'Same as hip thrust but on floor, squeeze hard at top', cue_feel: 'Glutes', cue_avoid: 'Using lower back instead of glutes' },
  { name: 'Walking Lunge', cue_imagine: 'Stepping forward and dropping straight down not forward', cue_feel: 'Quads and glutes', cue_avoid: 'Knee going past toes or torso leaning' },
  { name: 'Bulgarian Split Squat', cue_imagine: 'Sitting straight down on your front leg, back leg just balances', cue_feel: 'Quads and glutes of front leg', cue_avoid: 'Leaning forward or pushing off back foot' },
  { name: 'Calf Raise', cue_imagine: 'Pushing floor away through ball of foot, full stretch at bottom', cue_feel: 'Calves', cue_avoid: 'Partial range or bouncing at bottom' },
  { name: 'Step Up', cue_imagine: 'Pushing through heel of elevated foot to stand up', cue_feel: 'Glutes and quads', cue_avoid: 'Pushing off back foot or leaning forward' },
  { name: 'Overhead Press', cue_imagine: 'Pushing the ceiling away, pressing slightly back over your head', cue_feel: 'Shoulders and triceps', cue_avoid: 'Arching lower back or pressing forward of head' },
  { name: 'Seated Dumbbell Press', cue_imagine: 'Push ceiling, keep ribs down, same as overhead press', cue_feel: 'Front and side delts', cue_avoid: 'Lower back arch or elbows too far forward' },
  { name: 'Arnold Press', cue_imagine: 'Rotating from palms facing you to palms facing out as you press', cue_feel: 'Full shoulder', cue_avoid: 'Rushing the rotation or arching back' },
  { name: 'Lateral Raise', cue_imagine: 'Pushing dumbbells away from your body making your body wider', cue_feel: 'Side delts', cue_avoid: 'Shrugging traps or swinging momentum' },
  { name: 'Cable Lateral Raise', cue_imagine: 'Push outward not upward, lead with elbow not wrist', cue_feel: 'Side delts', cue_avoid: 'Pulling with wrist or leaning too far' },
  { name: 'Front Raise', cue_imagine: 'Lifting weight like an airplane wing, arm straight', cue_feel: 'Front delts', cue_avoid: 'Using momentum or going above shoulder height' },
  { name: 'Rear Delt Fly', cue_imagine: 'Spreading arms apart not pulling back, move from elbows', cue_feel: 'Rear delts', cue_avoid: 'Squeezing only traps or shrugging' },
  { name: 'Reverse Pec Deck', cue_imagine: 'Spreading arms apart like opening wings, chest stays on pad', cue_feel: 'Rear delts and upper back', cue_avoid: 'Shrugging or using momentum' },
  { name: 'Barbell Biceps Curl', cue_imagine: 'Elbow pinned to side, shorten the biceps not swing the shoulder', cue_feel: 'Front of upper arm', cue_avoid: 'Moving elbows forward or swinging back' },
  { name: 'Dumbbell Curl', cue_imagine: 'Elbow stays fixed, rotate wrist as you curl', cue_feel: 'Biceps peak', cue_avoid: 'Swinging shoulder or elbows drifting' },
  { name: 'Hammer Curl', cue_imagine: 'Pulling dumbbell up like a hammer, thumbs toward ceiling', cue_feel: 'Biceps and brachialis', cue_avoid: 'Swinging or twisting wrist' },
  { name: 'Incline Dumbbell Curl', cue_imagine: 'Letting arms hang fully back, curling with full range', cue_feel: 'Long head of biceps', cue_avoid: 'Bringing elbows forward or partial range' },
  { name: 'Concentration Curl', cue_imagine: 'Elbow braced on inner thigh, curl slowly and squeeze at top', cue_feel: 'Biceps peak', cue_avoid: 'Twisting torso or using momentum' },
  { name: 'Preacher Curl', cue_imagine: 'Lowering fully to stretch then curling without lifting elbow off pad', cue_feel: 'Lower biceps', cue_avoid: 'Partial range or elbow lifting off pad' },
  { name: 'Triceps Pushdown', cue_imagine: 'Pushing rope toward pockets, elbows fixed to sides', cue_feel: 'Back of upper arm', cue_avoid: 'Leaning bodyweight into it or elbows drifting' },
  { name: 'Overhead Triceps Extension', cue_imagine: 'Elbows pointing forward like headlights, let weight stretch triceps', cue_feel: 'Long head of triceps', cue_avoid: 'Elbows flaring wide or arching back' },
  { name: 'Triceps Dips', cue_imagine: 'Keeping torso upright and elbows close, lower controlled', cue_feel: 'Triceps', cue_avoid: 'Leaning forward or flaring elbows' },
  { name: 'Skull Crusher', cue_imagine: 'Lowering bar toward forehead by bending only the elbow', cue_feel: 'Triceps', cue_avoid: 'Moving upper arm or losing elbow position' },
  { name: 'Close Grip Bench Press', cue_imagine: 'Pressing bar up while keeping elbows tucked close to body', cue_feel: 'Triceps and inner chest', cue_avoid: 'Elbows flaring or grip too narrow' },
  { name: 'Cable Triceps Kickback', cue_imagine: 'Hinging forward, extending arm fully back until elbow locks', cue_feel: 'Triceps', cue_avoid: 'Swinging arm or not reaching full extension' },
  { name: 'Plank', cue_imagine: 'Pulling elbows toward toes without moving, squeeze glutes and abs', cue_feel: 'Abs not lower back', cue_avoid: 'Hips sagging or holding breath' },
  { name: 'Cable Crunch', cue_imagine: 'Bringing ribs toward pelvis, curl spine down slowly', cue_feel: 'Abs', cue_avoid: 'Pulling with arms or turning into hip hinge' },
  { name: 'Hanging Leg Raise', cue_imagine: 'Pulling hips toward ribs not just lifting legs', cue_feel: 'Lower abs', cue_avoid: 'Swinging, momentum or half range' },
  { name: 'Ab Wheel Rollout', cue_imagine: 'Rolling forward while keeping abs braced like absorbing a punch', cue_feel: 'Full core', cue_avoid: 'Hips dropping or lower back arching' },
  { name: 'Crunches', cue_imagine: 'Bringing ribs toward hips not head toward knees', cue_feel: 'Upper abs', cue_avoid: 'Pulling neck or doing full sit up motion' },
  { name: 'Bicycle Crunch', cue_imagine: 'Rotating ribs toward opposite knee, slow and controlled', cue_feel: 'Obliques and abs', cue_avoid: 'Pulling neck or rushing reps' },
  { name: 'Russian Twist', cue_imagine: 'Rotating from ribs not just arms, feet can stay down', cue_feel: 'Obliques', cue_avoid: 'Rounding spine or swinging arms only' },
  { name: 'Leg Raise', cue_imagine: 'Pressing lower back into floor as you lower legs', cue_feel: 'Lower abs', cue_avoid: 'Arching lower back or dropping legs fast' },
  { name: 'Side Plank', cue_imagine: 'Pushing hips toward ceiling, body one straight line', cue_feel: 'Obliques', cue_avoid: 'Hips sagging or rotating forward' },
  { name: 'Dead Bug', cue_imagine: 'Pressing lower back into floor, extend opposite arm and leg slowly', cue_feel: 'Deep core', cue_avoid: 'Arching back or rushing movement' },
  { name: 'Burpee', cue_imagine: 'Jumping back to plank as one unit, jumping up and fully extending', cue_feel: 'Full body', cue_avoid: 'Sagging hips in plank or half jump' },
  { name: 'Box Jump', cue_imagine: 'Loading hips back then exploding through full extension, land softly', cue_feel: 'Quads and glutes', cue_avoid: 'Landing with stiff knees or jumping too high' },
  { name: 'Kettlebell Swing', cue_imagine: 'Snapping hips forward like closing a door, arms just follow', cue_feel: 'Glutes and hamstrings', cue_avoid: 'Squatting the swing or using arms to lift' },
  { name: 'Battle Ropes', cue_imagine: 'Driving waves from your hips and shoulders not just arms', cue_feel: 'Shoulders and core', cue_avoid: 'Only using arms or losing core tension' },
  { name: 'Sled Push', cue_imagine: 'Leaning into sled at 45 degrees, driving through full foot', cue_feel: 'Quads, glutes and full body', cue_avoid: 'Upright posture or short steps' },
  { name: 'Rowing Machine', cue_imagine: 'Legs first then lean back then pull arms, always in that order', cue_feel: 'Legs, back and arms in sequence', cue_avoid: 'Pulling with arms first or rounding back' },
  { name: 'Jump Rope', cue_imagine: 'Small jumps from calf not whole leg, both feet together', cue_feel: 'Calves and coordination', cue_avoid: 'Jumping too high or landing flat-footed' },
  { name: 'Mountain Climber', cue_imagine: 'Driving knee toward chest while keeping hips flat and core braced', cue_feel: 'Core and hip flexors', cue_avoid: 'Hips rising or losing plank position' },
]

const cueNameToJsonName = {
  'Bench Press': 'Barbell Bench Press',
  'Incline Bench Press': 'Incline Barbell Bench Press',
  'Decline Bench Press': 'Decline Barbell Bench Press',
  'Dumbbell Chest Press': 'Dumbbell Bench Press',
  'Chest Fly': 'Dumbbell Fly',
  'Pec Deck': 'Pec Deck Fly',
  'Dips': 'Chest Dip',
  'Cable Crossover': 'Low to High Cable Fly',
  'Lat Pulldown': 'Lat Pulldown Wide Grip',
  'Wide Grip Pulldown': 'Lat Pulldown Wide Grip',
  'Close Grip Pulldown': 'Lat Pulldown Close Grip',
  'Seated Cable Row': 'Cable Row',
  'One Arm Dumbbell Row': 'Dumbbell Row',
  'T-Bar Row': 'T Bar Row',
  'Assisted Pull Up': 'Assisted Pull Up',
  'Deadlift': 'Conventional Deadlift',
  'Barbell Squat': 'Back Squat',
  'Leg Curl': 'Seated Leg Curl',
  'Calf Raise': 'Calf Raise Standing',
  'Lateral Raise': 'Dumbbell Lateral Raise',
  'Front Raise': 'Front Raise Dumbbell',
  'Barbell Biceps Curl': 'Barbell Curl',
  'Triceps Pushdown': 'Cable Rope Pushdown',
  'Triceps Dips': 'Parallel Bar Dip Triceps',
  'Cable Triceps Kickback': 'Kickback',
  'Crunches': 'Weighted Crunch',
  'Leg Raise': 'Captain Chair Leg Raise',
  'Burpee': 'Burpees',
  'Battle Ropes': 'Battle Ropes',
  'Box Jump': 'Box Step Cardio',
}

const cueByJsonName = new Map()

for (const cue of cues) {
  const jsonName = cueNameToJsonName[cue.name] ?? cue.name
  cueByJsonName.set(jsonName, {
    cue_imagine: cue.cue_imagine,
    cue_feel: cue.cue_feel,
    cue_avoid: cue.cue_avoid,
  })
}

const exercises = JSON.parse(readFileSync(exercisesPath, 'utf8'))

const updated = exercises.map((exercise) => {
  const cue = cueByJsonName.get(exercise.name)
  return {
    ...exercise,
    cue_imagine: cue?.cue_imagine ?? null,
    cue_feel: cue?.cue_feel ?? null,
    cue_avoid: cue?.cue_avoid ?? null,
  }
})

writeFileSync(exercisesPath, `${JSON.stringify(updated, null, 2)}\n`)
console.log(`Updated ${updated.length} exercises`)
console.log(`With cues: ${updated.filter((e) => e.cue_imagine).length}`)
