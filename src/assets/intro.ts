import introJS from 'intro.js';

let introJs: any | null;

export const useIntroJs = (): any => {
  
  if(introJs == null) {
    introJs = introJS();
  }

  return introJs;
}