import { setView } from './app';
import { fetchConfig, setActiveModule } from './modules';
import { fetchDetailedPermissions } from './permissions';

/**
 * Coordination Action: updateView
 * Orchestrates navigation and data fetching across multiple domain stores.
 */
export const updateView = async (view, module = null) => {
  setView(view);
  
  if (module && module.id) {
    setActiveModule(module);
    
    // Strategy: Configuration is needed for both 'config' and 'permissions' views
    if (view === 'config' || view === 'permissions') {
      await fetchConfig(module.id);
    }
    
    // Detailed permissions only needed for 'permissions' view
    if (view === 'permissions') {
      await fetchDetailedPermissions(module.id);
    }
  }
};
