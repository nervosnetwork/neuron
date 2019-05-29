export enum MenuCommand {
  ShowAbout = 'show-about',
  ShowPreferences = 'show-preferences',
  ShowTerminal = 'show-terminal',
  OpenNervosWebsite = 'open-nervos-website',
  OpenSourceCodeRepository = 'open-sourcecode-repository',
  SetUILocale = 'set-ui-language',
}

export enum URL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Preference = '/settings/general',
  Terminal = '/terminal',
}

export default { MenuCommand, URL }
