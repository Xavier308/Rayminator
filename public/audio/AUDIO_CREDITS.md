# Audio Credits

This document contains information about the audio files used in the Rayminator game, including credits for the original creators and conversion notes.

## Sound Credits

All audio files were sourced from [Freesound.org](https://freesound.org) under their respective licenses.

| Original File | Creator | License | Link | Used As |
|---------------|---------|---------|------|---------|
| Laser Shot Big 4 | Bubaproducer | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Sound #151020](https://freesound.org/people/bubaproducer/sounds/151020/) | `laser.mp3` |
| ExplosionRETRO.wav | combine2005 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Sound #488294](https://freesound.org/people/combine2005/sounds/488294/) | `explosion.mp3` |
| level_complete.wav | jivatma07 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Sound #122255](https://freesound.org/people/jivatma07/sounds/122255/) | `level-complete.mp3` |
| Arcade Music Loop.wav | joshuaempyre | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Sound #251461](https://freesound.org/people/joshuaempyre/sounds/251461/) | `arcade-loop.mp3` |

## File Conversion Notes

Since browser support for WAV files can be inconsistent and WAV files are typically much larger than MP3 files, all audio was converted to MP3 format for web use.

### FFmpeg Conversion Command

The following FFmpeg command was used to convert WAV files to MP3:

```bash
ffmpeg -i input.wav -b:a 192k output.mp3
```

### FFmpeg Installation

For Ubuntu/Debian-based systems:

```bash
sudo apt install ffmpeg
```

For macOS (using Homebrew):

```bash
brew install ffmpeg
```

For Windows:
Download from [FFmpeg's official website](https://ffmpeg.org/download.html) or install using [Chocolatey](https://chocolatey.org/):

```powershell
choco install ffmpeg
```

## Audio Implementation

The audio files are loaded and managed by the `AudioSystem.jsx` component, which:

1. Handles background music looping
2. Provides global methods to play sound effects
3. Manages audio enabling/disabling
4. Ensures audio starts on user interaction (to comply with browser autoplay policies)

## License Requirements

When using these sounds in your projects, please respect the original licenses:

- CC BY 3.0 requires attribution to the original author
- CC0 1.0 places the work in the public domain, so no attribution is legally required (though it's still nice to give credit)

For proper attribution in public releases, please include the creator names and links listed in this document.