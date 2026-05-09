export type WelcomeEntry = {
  /** Mobile copy. Hard cap 40 chars. */
  short: string
  /** Desktop copy. Hard cap 140 chars. */
  long: string
}

export const MECHANIC_TIPS: readonly WelcomeEntry[] = [
  { short: 'Torque to spec, never by feel.',     long: 'Torque to spec — never by feel. Hand-tight strips threads, stretches studs, and warps brake rotors.' },
  { short: 'Check tire pressure cold.',           long: 'Check tire pressure cold — heat from driving raises PSI 2–4, masking real low pressure.' },
  { short: 'Bleed brakes furthest first.',        long: 'Bleed brakes from the furthest caliper toward the master cylinder to push old fluid out cleanly.' },
  { short: 'Brake fluid every 2 years.',          long: 'Replace brake fluid every 2 years — it absorbs water and boils early under hard braking.' },
  { short: 'P0420 → cat or O2 sensor.',           long: 'P0420 means catalyst inefficiency; the upstream O2 sensor is the usual culprit before the cat itself.' },
  { short: 'P0171 → check vacuum leaks.',         long: 'P0171 lean code — start with vacuum leaks before chasing fuel pressure or injectors.' },
  { short: 'Rotate tires every 8,000 km.',        long: 'Rotate tires every 8,000 km to even out wear and extend tread life by 25–30%.' },
  { short: 'Coolant: 50/50 distilled.',           long: 'Coolant should be 50/50 with distilled water — tap water minerals scale the cooling system.' },
  { short: 'Never mix DOT 3 and DOT 5.',          long: 'DOT 3 and 4 are glycol; DOT 5 is silicone. Mixing them gels the entire brake system.' },
  { short: 'Measure spark plug gap.',             long: 'Measure plug gap on every install — pre-gapped does not mean correct for your engine.' },
  { short: 'Anti-seize on alu heads.',            long: 'Anti-seize on plug threads in aluminum heads prevents galling and stripped spark plug holes.' },
  { short: 'Crack lugs before lifting.',          long: 'Crack lug nuts loose before lifting the car — easier and safer with the tire on the ground.' },
  { short: 'Star-pattern lug torque.',            long: 'Torque lug nuts in a star pattern to seat the wheel evenly against the hub.' },
  { short: 'Re-torque lugs after 80 km.',         long: 'Re-torque lug nuts after ~80 km on new wheels — settling can drop clamp load.' },
  { short: 'Battery: neg first off.',             long: 'Disconnect the negative battery terminal first, reconnect it last — prevents accidental shorts to body.' },
  { short: 'OEM filters beat most.',              long: 'OEM filters tend to beat most aftermarket on flow, fit, and bypass-valve consistency.' },
  { short: 'Check oil hot, level, idle.',         long: 'Check oil hot, on level ground, ~5 min after shutdown for an honest reading.' },
  { short: 'Burnt ATF? Change it.',               long: 'Burnt-smelling ATF means the clutches are frying — change it before the transmission goes.' },
  { short: 'Torn CV boot = clock ticks.',         long: 'A torn CV boot dries the joint fast — replace the boot before the joint starts clicking.' },
  { short: 'Cold-start squeal? Belt.',            long: 'Squealing on cold start usually means a glazed or loose serpentine belt.' },
  { short: 'Knock under load = pre-ig.',          long: 'Knock under load often means pre-ignition — check fuel grade, timing, and carbon buildup.' },
  { short: 'Misfire? Swap coil to test.',         long: 'Misfire on cylinder X — swap that coil with a known-good one; if the misfire follows, the coil is bad.' },
  { short: 'Read the freeze frame.',              long: 'Scan-tool freeze frame shows the conditions when the code set — read it before guessing.' },
  { short: 'White smoke = coolant.',              long: 'Smoke colors: white = coolant, blue = oil, black = fuel rich.' },
  { short: 'Oil filter: hand + 3/4.',             long: 'Tighten an oil filter by hand until it seats, then 3/4 turn — gasket-tight, not heroic.' },
  { short: 'New crush washer always.',            long: 'Use a new oil drain plug crush washer every change to seal without overtightening.' },
  { short: 'Inspect the oil pan.',                long: 'Check for metal flake in the oil pan during changes — early warning for engine wear.' },
  { short: 'Bearing growl shifts steer.',         long: 'A wheel bearing growl changes pitch when you steer — load shifts to the bad side.' },
  { short: 'Inner tie rod = slop.',               long: 'Inner tie rod play feels like steering slop on-center — check it at the rack boot.' },
  { short: 'Sway link clunk = bumps.',            long: 'Sway bar end-link clunk shows up over speed bumps and uneven pavement.' },
  { short: 'Strut bearing squeak.',               long: 'A binding strut mount bearing squeaks while turning at low speed.' },
  { short: 'Brake judder = rotors.',              long: 'Brake judder is warped rotors or uneven pad-deposit transfer; bed pads in correctly.' },
  { short: 'Rotor min thickness rules.',          long: 'Never machine rotors below the cast minimum thickness — heat capacity drops too far.' },
  { short: 'Bed in new pads.',                    long: 'Bed in new pads with controlled stops before any hard braking to set the friction layer.' },
  { short: 'Air filter: tap, no air.',            long: 'Tap air filters clean — compressed air punches holes through the filter media.' },
  { short: 'MAF cleaner only.',                   long: 'Use MAF-specific cleaner only — carb cleaner leaves residue that throws sensor readings.' },
  { short: 'TB carbon = idle hunt.',              long: 'Throttle body carbon causes idle hunt and cold-start stumble; clean it.' },
  { short: 'EGR clog → P0401.',                   long: 'EGR clog throws P0401 — clean the passages before swapping the valve.' },
  { short: 'Glow plugs: test resistance.',        long: 'Test glow plug resistance one by one — do not replace all four blind.' },
  { short: 'CR diesel: never crack.',             long: 'On a common-rail diesel, never crack injector lines under pressure — fuel atomizes and ignites.' },
  { short: 'Belt: years OR km.',                  long: 'Timing belt interval is whichever comes first: years or km. Time still kills the rubber.' },
  { short: 'Pump with the belt.',                 long: 'Replace the water pump whenever you do the timing belt — you are already in there.' },
  { short: 'Tensioners: silent + free.',          long: 'Idler and tensioner pulleys should spin silent and free — any roughness, replace them.' },
  { short: 'Mounts vibrate at idle.',             long: 'Worn motor mounts show up as idle vibration that smooths out under load.' },
] as const

if (process.env.NODE_ENV !== 'production') {
  for (const e of MECHANIC_TIPS) {
    if (e.short.length > 40) throw new Error(`Mechanic tip 'short' exceeds 40 chars: ${e.short}`)
    if (e.long.length > 140) throw new Error(`Mechanic tip 'long' exceeds 140 chars: ${e.long}`)
  }
}
