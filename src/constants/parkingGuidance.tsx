export type ParkingType = "back-in" | "driveway" | "campsite" | "pull-through";

export const parkingTypes: { label: string; value: ParkingType }[] = [
  { label: "Back-in campsite", value: "back-in" },
  { label: "Driveway", value: "driveway" },
  { label: "Campground site", value: "campsite" },
  { label: "Pull-through", value: "pull-through" },
];

export type GuidanceStep = {
  title: string;
  instruction: string;
  warning?: string;
  voicePrompt?: string;
};

export const guidanceByType: Record<ParkingType, GuidanceStep[]> = {
  "back-in": [
    {
      title: "Line up the rig",
      instruction:
        "Pull forward until the truck and trailer are straight. Stop with the trailer slightly past the campsite entrance.",
      warning:
        "Check both sides before backing. Make sure the rear of the trailer has room to swing.",
      voicePrompt: "Line up the rig and stop before backing.",
    },
    {
      title: "Start the turn",
      instruction:
        "Back up slowly. Turn the steering wheel a small amount and watch the trailer begin turning into the site.",
      warning:
        "Use small steering movements. Stop if the trailer angle starts getting sharp.",
      voicePrompt: "Back slowly and start the turn.",
    },
    {
      title: "Follow the trailer",
      instruction:
        "Keep backing slowly. Follow the trailer with small steering corrections and watch both mirrors.",
      warning:
        "Watch the inside corner, outside swing, and any post, tree, or hookup near the trailer.",
      voicePrompt: "Follow the trailer with small corrections.",
    },
    {
      title: "Straighten the rig",
      instruction:
        "As the trailer lines up with the site, straighten the steering wheel. Pull forward if the truck and trailer angle gets too sharp.",
      warning:
        "Do not keep backing if the trailer is folding too sharply. Pull forward and reset.",
      voicePrompt:
        "Straighten the rig. Pull forward if the angle is too sharp.",
    },
    {
      title: "Final position",
      instruction:
        "Back in inches at a time. Stop, get out, and confirm rear, side, roof, and hookup clearance before finishing.",
      warning:
        "Do not rely only on the screen. Get out and confirm the final position visually.",
      voicePrompt: "Back in inches at a time and confirm clearance.",
    },
  ],

  driveway: [
    {
      title: "Set up the approach",
      instruction:
        "Pull forward past the driveway. Angle the truck so the trailer can enter without cutting the corner.",
      warning:
        "Watch mailbox, curb, ditch, fence, parked vehicles, and rear swing clearance.",
      voicePrompt: "Set up the driveway approach.",
    },
    {
      title: "Start backing in",
      instruction:
        "Back up slowly and let the trailer move toward the driveway entrance.",
      warning:
        "Stop if the trailer is aimed at the curb, mailbox, fence, or ditch.",
      voicePrompt: "Back slowly toward the driveway.",
    },
    {
      title: "Make small corrections",
      instruction:
        "Use small steering corrections. Give the trailer time to respond before turning more.",
      warning: "Large steering corrections can quickly over-angle the trailer.",
      voicePrompt: "Use small steering corrections.",
    },
    {
      title: "Pause at the tight point",
      instruction:
        "Pause when the trailer is halfway into the driveway. Confirm both sides are clear before continuing.",
      warning:
        "Check the rear corner, front truck swing, and trailer side clearance before backing farther.",
      voicePrompt: "Stop and check both sides.",
    },
    {
      title: "Finish straight",
      instruction:
        "Straighten the truck and trailer. Back in slowly until the trailer is positioned safely.",
      warning:
        "Stop before the rear gets close to a garage, fence, wall, or parked vehicle.",
      voicePrompt: "Finish straight and stop before the rear gets close.",
    },
  ],

  campsite: [
    {
      title: "Walk the site first",
      instruction:
        "Walk the campsite before backing. Look for hookups, trees, picnic tables, posts, rocks, and low branches.",
      warning:
        "Check slide-out space, roof clearance, and the side where the hookups will be.",
      voicePrompt: "Walk the site and check for obstacles.",
    },
    {
      title: "Choose the target line",
      instruction:
        "Pick a clear line where you want the trailer wheels to track into the site.",
      warning:
        "Make sure the target line avoids posts, hookups, trees, and the picnic table.",
      voicePrompt: "Choose your target line.",
    },
    {
      title: "Back onto the line",
      instruction:
        "Back up slowly. Keep the trailer wheels close to the target line and make small corrections.",
      warning: "Stop and reset if the trailer is drifting toward an obstacle.",
      voicePrompt: "Back slowly onto the target line.",
    },
    {
      title: "Center the trailer",
      instruction:
        "Center the trailer in the campsite. Leave room for slide-outs, stairs, hookups, and walking space.",
      warning: "Check both sides before backing deeper into the site.",
      voicePrompt: "Center the trailer in the campsite.",
    },
    {
      title: "Final campsite check",
      instruction:
        "Stop, get out, and confirm rear, side, roof, slide-out, stairs, and hookup clearance before finishing.",
      warning:
        "Do not finish parking until the clearance has been checked outside the vehicle.",
      voicePrompt: "Stop and do a final campsite clearance check.",
    },
  ],

  "pull-through": [
    {
      title: "Enter slowly",
      instruction:
        "Approach the pull-through slowly. Keep the truck and trailer as straight as possible.",
      warning: "Do not cut the turn early with a long trailer.",
      voicePrompt: "Enter slowly and keep the rig straight.",
    },
    {
      title: "Watch the trailer swing",
      instruction:
        "As the truck enters, watch the rear trailer corner and leave clearance around posts, hookups, trees, and curbs.",
      warning: "The rear of the trailer can swing wider than expected.",
      voicePrompt: "Watch the rear trailer swing.",
    },
    {
      title: "Center the trailer",
      instruction:
        "Pull forward slowly until the trailer is centered in the space with room for doors, stairs, and slide-outs.",
      warning: "Check both sides before stopping for the final position.",
      voicePrompt: "Center the trailer in the space.",
    },
    {
      title: "Final position",
      instruction:
        "Stop, get out, and confirm rear, side, roof, hookup, and slide-out clearance before setting up.",
      warning:
        "Do not rely only on mirrors or the screen for the final clearance check.",
      voicePrompt: "Stop and confirm final clearance.",
    },
  ],
};
