import keetoLogo from '@/assets/keeto-logo.png';
import systegoLogo from '@/assets/systego-logo.jpg';

// Helper to get active project info from localStorage
export function getStoredProject() {
  if (typeof window === 'undefined') return null;
  try {
    const rawProject = localStorage.getItem('project');
    if (rawProject) {
      return JSON.parse(rawProject);
    }
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user?.project_id) {
        return {
          id: user.project_id,
          name: user.project_name || '',
          logo: user.project_logo || '',
          design: user.project_design || 'design 1',
        };
      }
    }
  } catch (e) {
    console.error('Error reading stored project:', e);
  }
  return null;
}

export function resolveProjectBrand() {
  const project = getStoredProject();

  if (project?.design) {
    const d = project.design.toString().toLowerCase().trim();
    if (d === 'design 2' || d === 'systego') {
      return 'systego';
    }
    if (d === 'design 1' || d === 'keeto') {
      return 'keeto';
    }
  }

  // Fallback if no project in storage
  const explicitProject = (
    import.meta.env.project ||
    import.meta.env.PROJECT ||
    import.meta.env.VITE_PROJECT ||
    ''
  )
    .toString()
    .toLowerCase()
    .trim();

  if (explicitProject === 'keeto' || explicitProject === 'systego') {
    return explicitProject;
  }

  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (host.includes('systego')) {
    return 'systego';
  }

  return 'keeto';
}

export function getBrandConfig() {
  const activeBrand = resolveProjectBrand();
  const isKeeto = activeBrand === 'keeto';
  const isSystego = activeBrand === 'systego';
  const project = getStoredProject();

  const customLogo = project?.logo;
  const projectName = project?.name;

  return {
    key: isKeeto ? 'keeto' : 'systego',
    name: projectName || (isKeeto ? 'Keeto' : 'Systego'),
    appTitle: projectName ? `${projectName} Sales` : (isKeeto ? 'Keeto Sales' : 'Systego Sales'),
    logo: customLogo || (isKeeto ? keetoLogo : systegoLogo),
    logoClassName: isKeeto ? 'w-36 h-16 object-contain' : 'w-20 h-20 object-contain',
    logoAlt: projectName || (isKeeto ? 'Keeto Logo' : 'Company Logo'),
    emailPlaceholder: isKeeto ? 'name@keeto.net' : 'name@systego.net',
    favicon: customLogo || (isKeeto ? '/keeto-favicon.svg' : '/systego-favicon.svg'),
    overviewCardClass: isKeeto
      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-zinc-950 border border-yellow-300/60 transition-transform hover:scale-[1.02] min-h-full'
      : 'bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-white border border-red-400/50 transition-transform hover:scale-[1.02] min-h-full',
    overviewIconWrapperClass: isKeeto
      ? 'bg-black/10 p-4 rounded-full mb-4 shadow-inner'
      : 'bg-white/20 p-4 rounded-full mb-4 shadow-inner',
    overviewIconClass: isKeeto ? 'h-8 w-8 text-zinc-950' : 'h-8 w-8 text-white',
    overviewLabelClass: isKeeto
      ? 'text-sm font-semibold uppercase tracking-wider text-zinc-900 text-center'
      : 'text-sm font-semibold uppercase tracking-wider text-red-100 text-center',
  };
}

// Dynamic brandConfig Proxy to always reflect current project in state/storage
export const brandConfig = new Proxy({}, {
  get(target, prop) {
    const current = getBrandConfig();
    return current[prop];
  }
});

export const isKeeto = resolveProjectBrand() === 'keeto';
export const isSystego = resolveProjectBrand() === 'systego';

export function applyBrandTheme(roleSuffix = '') {
  if (typeof document === 'undefined') return;

  const current = getBrandConfig();
  document.documentElement.setAttribute('data-brand', current.key);
  document.title = roleSuffix
    ? `${current.appTitle} - ${roleSuffix}`
    : current.appTitle;

  const iconLinks = document.querySelectorAll("link[rel*='icon']");
  if (current.logo && (current.logo.startsWith('http') || current.logo.startsWith('/uploads'))) {
    iconLinks.forEach((link) => {
      link.setAttribute('href', current.logo);
    });
  } else if (current.key === 'systego') {
    iconLinks.forEach((link) => {
      if (link.getAttribute('rel') === 'apple-touch-icon') {
        link.setAttribute('href', '/systego-favicon.svg');
      } else {
        link.setAttribute('type', 'image/svg+xml');
        link.setAttribute('href', '/systego-favicon.svg');
      }
    });
  } else {
    iconLinks.forEach((link) => {
      if (link.getAttribute('type') === 'image/svg+xml') {
        link.setAttribute('href', '/keeto-favicon.svg');
      }
    });
  }
}

export function setProjectBrand(project) {
  if (!project) return;
  try {
    localStorage.setItem('project', JSON.stringify(project));
    applyBrandTheme();
  } catch (e) {
    console.error('Error saving project to localStorage:', e);
  }
}
