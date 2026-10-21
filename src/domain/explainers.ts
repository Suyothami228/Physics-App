export type VideoStep = { time: number; en: string; ta: string };
export const explainers: Record<
  string,
  { src: string; poster: string; steps: VideoStep[] }
> = {
  "relative-observer": {
    src: "/review/animations/observer.mp4",
    poster: "/review/animations/observer.jpg",
    steps: [
      {
        time: 0,
        en: "Earth observer E: A moves east at 30 m/s and B at 18 m/s. Both velocities use the same reference frame.",
        ta: "பூமி நோக்குநர் E: A கிழக்கே 30 m/s, B கிழக்கே 18 m/s. இரு வேகங்களும் ஒரே நோக்குநர் சார்பானவை.",
      },
      {
        time: 4,
        en: "Move into B’s frame: subtract 18 m/s from both velocities. B is now at rest; A moves east at 12 m/s.",
        ta: "B சார்பாக நோக்குக: இரு வேகங்களிலிருந்தும் 18 m/s ஐக் கழிக்கவும். B ஓய்வில் உள்ளது; A கிழக்கே 12 m/s கதியில் செல்கிறது.",
      },
      {
        time: 8,
        en: "Vector subtraction: add the reversed velocity of B to the velocity of A. The yellow arrow is the relative velocity.",
        ta: "காவிக் கழித்தல்: B இன் வேகத் திசையை மாற்றி A இன் வேகத்துடன் கூட்டுக. மஞ்சள் அம்பு தொடர்பு வேகத்தைக் காட்டுகிறது.",
      },
      {
        time: 12,
        en: "From B, A moves forward while B stays fixed. Playback is illustrative and time-compressed.",
        ta: "B இலிருந்து நோக்கும்போது A முன்னே செல்கிறது; B நிலையாக உள்ளது. அசைவூட்ட நேரம் விளக்கத்திற்காகச் சுருக்கப்பட்டுள்ளது.",
      },
      {
        time: 16,
        en: "Reverse the observer and object: V_BA = −V_AB. The magnitude stays 12 m/s, but the direction reverses.",
        ta: "பொருளையும் நோக்குநரையும் மாற்றினால் V_BA = −V_AB. பருமன் 12 m/s ஆகவே இருக்கும்; திசை எதிராகும்.",
      },
    ],
  },
  "relative-river": {
    src: "/review/animations/river.mp4",
    poster: "/review/animations/river.jpg",
    steps: [
      {
        time: 0,
        en: "The river is 1200 m wide. Boat speed relative to water is 5 m/s; current relative to Earth is 3 m/s.",
        ta: "ஆற்றின் அகலம் 1200 m. நீர் சார்பான வள்ளத்தின் கதி 5 m/s; பூமி சார்பான நீரோட்டக் கதி 3 m/s.",
      },
      {
        time: 4,
        en: "Shortest time: aim across the river. All 5 m/s carries the boat across, so t = 240 s. The current causes downstream drift.",
        ta: "மிகக் குறைந்த நேரம்: கரைக்குச் செங்குத்தாகச் செலுத்துக. 5 m/s முழுவதும் கடப்பதற்குப் பயன்படும்; t = 240 s. நீரோட்டம் கீழோட்ட விலகலை ஏற்படுத்தும்.",
      },
      {
        time: 8,
        en: "To land directly opposite, aim upstream. The boat’s upstream component cancels the 3 m/s current: θ = 36.87° from the bank normal.",
        ta: "நேர் எதிரே அடைய எதிரோட்டமாகச் செலுத்துக. வள்ளத்தின் எதிரோட்டக் கூறு 3 m/s நீரோட்டத்தைச் சமன் செய்கிறது: கரைக்குச் செங்குத்திலிருந்து θ = 36.87°.",
      },
      {
        time: 12,
        en: "The remaining across component is √(5²−3²) = 4 m/s. Crossing time is 1200/4 = 300 s.",
        ta: "கடக்கும் கூறு √(5²−3²) = 4 m/s. கடக்கும் நேரம் 1200/4 = 300 s.",
      },
      {
        time: 16,
        en: "Compare: shortest time is 240 s with 720 m drift. Directly opposite takes 300 s with zero drift. These answer different questions.",
        ta: "ஒப்பிடுக: மிகக் குறைந்த நேரம் 240 s; விலகல் 720 m. நேர் எதிரே அடைய 300 s; விலகல் பூச்சியம். இவை வெவ்வேறு தேவைகளுக்கான விடைகள்.",
      },
    ],
  },
};
