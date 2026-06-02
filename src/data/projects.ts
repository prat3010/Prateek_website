export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  color: string;
  actionWord: string;
  isLive: boolean;
}

export const projects: Project[] = [
  {
    id: 'earth-evolution-simulator',
    title: 'Earth Evolution Simulator',
    description:
      'A scenario-driven simulation game where players guide a planet through ten evolutionary eras by making high-stakes decisions.',
    longDescription:
      'Earth Evolution Simulator is a scenario-driven simulation game where players guide a planet through ten distinct evolutionary eras. By resolving high-stakes ecological and geological decisions, players navigate random events and path-dependent consequences to steer the planet toward one of four cosmic endings. The Python Flask backend maintains game state in-session and records player run telemetry into a local SQLite database, while a custom game engine models planetary habitability by tracking dynamic variables and applying a deferred trigger system ("echoes") for earlier decisions.',
    image: '/images/project-earth-simulator.webp',
    tags: ['Python', 'Flask', 'SQLite3', 'Jinja2', 'JavaScript', 'CSS'],
    liveUrl: 'https://earth-evolution-simulator.onrender.com',
    githubUrl: 'https://github.com/prat3010/earth-evolution-simulator',
    color: '#00E676',
    actionWord: 'BOOM!',
    isLive: true,
  },
  {
    id: 'paintmix-ai',
    title: 'PaintMix AI',
    description:
      'A camera-based paint mixing assistant that samples colors and calculates precise mixing proportions.',
    longDescription:
      'PaintMix AI is a mobile application that uses a device\'s camera to sample any real-world target color and automatically calculates the exact paint proportions needed to mix and match that color using the user\'s existing paint inventory. Under the hood, PaintMix AI converts sampled RGB image data into XYZ and CIELAB color spaces to perform advanced perceptual color-matching calculations using Delta E (CIE76 and CIE94) distance optimization. The custom-built algorithmic engine evaluates and ranks one-color (closest single matches), two-color, and three-color paint combinations by weight ratio partitions from a local inventory managed using Drift and SQLite. Furthermore, it automatically generates color-theory-informed feedback, detailing shifts in lightness, saturation, and hue temperature (warm vs. cool shifts) to guide artists in tuning their mixtures.',
    image: '/images/project-paintmix.webp',
    tags: ['Flutter', 'Dart', 'Riverpod', 'Drift', 'SQLite', 'Computer Vision'],
    liveUrl: 'https://paintmix-ai.web.app',
    githubUrl: 'https://github.com/prat3010/paintmix-ai',
    color: '#FF9100',
    actionWord: 'SPLAT!',
    isLive: false,
  },
  {
    id: 'iss-tracker',
    title: 'ISS Live Location Tracker',
    description:
      'A real-time International Space Station tracker displaying reverse-geocoded terrestrial location or nearest ocean/landmass.',
    longDescription:
      'Built on the FastAPI framework, this application continuously polls the Open-Notify API to retrieve the current latitude and longitude of the ISS. If the ISS is over land, the server utilizes geopy to reverse-geocode coordinates via the Nominatim API and fetch a precise address, state, and country. If the ISS is over water, the system runs an offline-capable KD-tree lookup via reverse_geocoder to find the nearest landmass, computes the geodesic distance using the oblate spheroid model, maps the coordinates to custom ocean bounding boxes, and pulls NASA\'s APOD API to serve a cached daily celestial background.',
    image: '/images/project-iss-tracker.webp',
    tags: ['Python', 'FastAPI', 'Jinja2', 'Geopy', 'NumPy', 'SciPy', 'APIs'],
    liveUrl: 'https://iss-tracker.pythonanywhere.com',
    githubUrl: 'https://github.com/prat3010/iss-tracker',
    color: '#2979FF',
    actionWord: 'WHOOSH!',
    isLive: false,
  },
  {
    id: 'metawipe',
    title: 'MetaWipe',
    description:
      'A privacy-first mobile app that strips metadata (EXIF, GPS, device data) from photos locally before sharing.',
    longDescription:
      'MetaWipe achieves absolute metadata sanitization by decoding selected images into raw pixel grids within secure, isolated background threads (using Dart isolates) and discarding the original container file entirely. Once the raw pixel data is reconstructed, it is re-encoded into a fresh JPEG or PNG container, ensuring no residual manufacturer notes or hidden thumbnail trackers survive. Operating completely offline, the app does not declare the android.permission.INTERNET permission, making it architecturally impossible to leak files or telemetry data to remote servers.',
    image: '/images/project-metawipe.webp',
    tags: ['Flutter', 'Dart', 'Riverpod', 'GoRouter', 'Exif', 'Cryptography'],
    liveUrl: 'https://play.google.com/store/apps/details?id=com.metawipe',
    githubUrl: 'https://github.com/prat3010/metawipe',
    color: '#00E676',
    actionWord: 'ZAP!',
    isLive: false,
  },
];
