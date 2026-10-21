# Manim explanations

These are original ManimGL scenes for Relative Velocity. They are pre-rendered teaching videos; the live React/Three.js labs remain in Explore. Each clip is 20 seconds, with five four-second teaching steps. There is no audio. Tamil and English captions are rendered by the app, so text stays readable on a phone and can change language without downloading another video.

## Rendering

Use a separate Python environment with `requirements.txt`. This is **ManimGL** (`manimlib`), not Manim Community (`manim`). FFmpeg and a working OpenGL renderer are required. The scenes use Arial text and do not require LaTeX. Render `ObserverChange` and `RiverStrategies` from `relative_velocity.py`, then publish H.264/yuv420p MP4 files with fast-start metadata at:

- `public/review/animations/observer.mp4`
- `public/review/animations/river.mp4`

Keep the five step boundaries at 0, 4, 8, 12 and 16 seconds synchronized with `src/domain/explainers.ts`. If changing the duration, update the captions and recheck every step visually. Do not run rendering during a student request or a Vercel build. Commit finished compact assets with the frontend, or host larger clips separately.

With the isolated environment activated and FFmpeg on PATH, run from the repository root:

```powershell
python -m pip install -r animations/requirements.txt
python -m manimlib animations/relative_velocity.py ObserverChange -w --config_file animations/render.yml --video_dir render-output --file_name observer
python -m manimlib animations/relative_velocity.py RiverStrategies -w --config_file animations/render.yml --video_dir render-output --file_name river
ffmpeg -y -i render-output/observer.mp4 -c copy -movflags +faststart public/review/animations/observer.mp4
ffmpeg -y -i render-output/river.mp4 -c copy -movflags +faststart public/review/animations/river.mp4
ffmpeg -y -ss 2 -i public/review/animations/observer.mp4 -frames:v 1 public/review/animations/observer.jpg
ffmpeg -y -ss 2 -i public/review/animations/river.mp4 -frames:v 1 public/review/animations/river.jpg
```

Keep intermediate render output outside version control. The JPG files provide a meaningful preview before playback starts. Check both 20-second clips and each caption boundary before publishing.

## Admin

Run Django migrations. In a lesson block, select **Explainer** to use one of the built-in clips. **Video URL** overrides that clip with a hosted video. For custom clips add **Video steps**, a list like:

```json
[{"time": 0, "en": "The observer is on Earth.", "ta": "நோக்குநர் பூமியில் உள்ளார்."}]
```

Times must increase, with both language captions supplied. Leaving steps empty uses the built-in captions only when using a built-in video. A custom URL without steps uses ordinary video playback, without unrelated built-in captions. Existing lesson text is preserved.

The player supports native video controls, play/pause, replay, step seeking, transcript, language switching and the lesson's pause-motion switch. Videos do not autoplay. They supplement the interactive labs rather than replace them.
