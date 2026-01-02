// flows index - combines all flow categories
import { pageTransitionFade } from './animations.js';
import { emailSubmitDashboard, googleAuthDashboard, logoutLogin } from './auth.js';

export const flows = {
  'flow:page_transition; style=fade': pageTransitionFade,
  'flow:email_submit > dashboard': emailSubmitDashboard,
  'flow:google_auth > dashboard': googleAuthDashboard,
  'flow:logout > login': logoutLogin
};