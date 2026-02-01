/**
 * THE PRISM — Controller Script
 * Manages the REALITY_INDEX slider and object interactions
 */

// Content database for each object
const objectContent = {
  'machine-4': {
    skeleton: 'AQUA HCD-3257GC washer-dryer. 1200 RPM extraction. Internal temp 28°C (2°C above ambient). Last cycle: 47 minutes ago.',
    blueprint: 'Processing node in the emotional solvent network. What enters dirty exits clean — but the dirt goes somewhere.',
    ghost: 'This machine runs warmer than the others. The lint trap holds fibers that don\'t match any fabric in the room. Someone\'s grief is still spinning in the drum.'
  },
  'chair-2': {
    skeleton: 'Molded plastic. 45cm seat height. Left side warped 3mm from repeated weight.',
    blueprint: 'Temporal compression site. Where waiting becomes a physical shape. The warp is accumulated patience.',
    ghost: '0.7°C warmer on left side, consistent with 67kg person leaning for approximately 28 minutes. The chair remembers the body longer than the body remembers the chair.'
  },
  'table-3': {
    skeleton: 'Laminate surface, 1.8m × 0.6m. One corner chipped. Thermal anomaly at coordinates (0.4m, 0.3m): 34°C.',
    blueprint: 'Ritual site where personal chaos is pressed into order. The folding is a mandala. The handprint is a prayer.',
    ghost: 'A handprint that isn\'t visible — but the warmth is there. Someone pressed their palm here while deciding something. The gesture repeats in the warmth gradient.'
  },
  'figure': {
    skeleton: 'Human silhouette, approximately 67kg mass, engaged in repetitive motor activity. Cotton-polyester blend fabric.',
    blueprint: 'A temporary node in the gesture-transmission network. They are both laundered and launderer. The fold is a prayer they didn\'t compose.',
    ghost: 'Their hands move with a rhythm learned from someone else. The shirt they\'re folding isn\'t theirs. It smells like a childhood home they can\'t name.'
  },
  'window': {
    skeleton: 'View: Kugayama, Suginami Ward, Tokyo. 35.6847°N, 139.5994°E. Vending machine glow (4200K). Bicycle leaning against fence.',
    blueprint: 'The laundromat is a node in a larger circuit — the night, the neighborhood, the consciousness that contains us. This window is a membrane between worlds.',
    ghost: 'Someone who lives here is dreaming this. Right now. The person who imagined this place into being walks these streets in daylight.'
  },
  'grey-water-door': {
    skeleton: '機械室 (Machine Room). Frosted glass. Grey water reclamation system behind. 300L capacity. Maintains 28°C for bacterial processing.',
    blueprint: 'This is where the laundromat stores what it removes. The emotional solvent. The memory extracted from fabric waits here before being released into the municipal system. Some rooms should stay closed.',
    ghost: 'The air here tastes like borrowed salt. Sometimes, at 3 AM, you can hear it slosh — a rhythm that doesn\'t match the pumps. Something moves in there. Not visually. Thermally.'
  },
  'change-machine': {
    skeleton: '¥1000 note acceptor, ¥100 coin dispenser. Manufactured 2018. Last transaction: 2:31 AM.',
    blueprint: 'The ritual exchange: clean currency for soiled time. The economy of purification. This is where you pay to forget.',
    ghost: 'The last person to use it left a fingerprint on the \'1000\' button. Their pulse was elevated. They stood here counting coins, deciding if the wash was worth it.'
  }
};

// Resonance phrases that appear during transitions
const resonancePhrases = [
  'What the data misses, the body remembers.',
  'The chair remembers the body longer than the body remembers the chair.',
  'You fold the shirt, but who folded you?',
  'The water leaves, but the memory of water remains.',
  'The measurement shows the weight. The ghost shows why it\'s heavy.',
  'This is not a place where people do laundry. This is a place where laundry does people.',
  'We all have gestures that aren\'t ours.',
  'The grey water holds what we paid to forget.'
];

// State
let currentReality = 0;
let isTransitioning = false;
let selectedObject = null;

// DOM Elements
const slider = document.getElementById('reality-index');
const infoPanel = document.getElementById('info-panel');
const resonanceEl = document.getElementById('resonance');
const objects = document.querySelectorAll('.object');
const phenomenon = document.querySelector('.phenomenon');

// Initialize
function init() {
  // Slider control
  slider.addEventListener('input', handleSliderChange);

  // Object clicks
  objects.forEach(obj => {
    obj.addEventListener('click', () => handleObjectClick(obj));
  });

  // Phenomenon click (the figure)
  if (phenomenon) {
    phenomenon.addEventListener('click', () => handleObjectClick(phenomenon));
  }

  // Close panel
  document.querySelector('.info-close').addEventListener('click', closePanel);

  // Update time display
  updateTime();
  setInterval(updateTime, 1000);

  // Initial state
  updateReality(0);
}

// Handle slider changes
function handleSliderChange(e) {
  const value = e.target.value / 100;
  updateReality(value);

  // Show resonance during significant transitions
  if (!isTransitioning && Math.abs(value - currentReality) > 0.1) {
    showResonance();
  }

  currentReality = value;
}

// Update CSS custom property for reality index
function updateReality(value) {
  document.documentElement.style.setProperty('--reality', value);

  // Update info panel content visibility if open
  if (selectedObject) {
    updatePanelContent(selectedObject);
  }
}

// Handle object click
function handleObjectClick(obj) {
  const id = obj.dataset.id;
  selectedObject = id;

  updatePanelContent(id);
  openPanel();
}

// Update panel with object content
function updatePanelContent(id) {
  const content = objectContent[id];
  if (!content) return;

  document.querySelector('.info-title').textContent = id.toUpperCase().replace('-', ' #');
  document.querySelector('.skeleton-content').textContent = content.skeleton;
  document.querySelector('.blueprint-content').textContent = content.blueprint;
  document.querySelector('.ghost-content').textContent = content.ghost;
}

// Panel controls
function openPanel() {
  infoPanel.classList.add('open');
}

function closePanel() {
  infoPanel.classList.remove('open');
  selectedObject = null;
}

// Show resonance text during transitions
function showResonance() {
  if (isTransitioning) return;

  isTransitioning = true;
  const phrase = resonancePhrases[Math.floor(Math.random() * resonancePhrases.length)];
  resonanceEl.querySelector('p').textContent = phrase;
  resonanceEl.classList.add('visible');

  setTimeout(() => {
    resonanceEl.classList.remove('visible');
    isTransitioning = false;
  }, 3000);
}

// Update time display (frozen at 02:47)
function updateTime() {
  const now = new Date();
  const seconds = now.getSeconds().toString().padStart(2, '0');
  document.querySelector('.time').textContent = `02:47:${seconds}`;
}

// Start
init();
