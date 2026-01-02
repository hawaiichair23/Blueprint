// main components index - combines all component categories
import { nav } from './navigation/index.js';
import { hero, steps } from './content/index.js';
import { featuresGrid, projectCards } from './layout/index.js';
import { providerGoogle, providerApple, formEmail, separatorText, uiDashboard, uiFooter } from './auth/index.js';

export const components = {
  'nav': nav,
  'hero': hero,
  'steps': steps,
  'features-grid': featuresGrid,
  'project-cards': projectCards,
  'provider:google': providerGoogle,
  'provider:apple': providerApple,
  'form:email; fields=[email,password]; submit="Sign In"; validation=[required,email_format]': formEmail,
  'separator:text; content="OR CONTINUE WITH EMAIL"': separatorText,
  'ui:dashboard; welcome="Welcome, John Doe"; state=hidden; includes=[logout_button]': uiDashboard,
  'ui:footer; text="Don\'t have an account?"; link=[text="Sign up",href="#"]': uiFooter
};