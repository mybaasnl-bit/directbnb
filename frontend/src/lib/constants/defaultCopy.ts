/**
 * Default Copy Registry — single source of truth for all dynamic copy keys.
 *
 * Used by:
 *   1. useDynamicCopy(key, fallback) hooks throughout the dashboard (fallback arg mirrors value)
 *   2. POST /admin/sync-copy — inserts missing keys into the DB so admins see the full list
 *
 * Convention: [page].[section].[element]
 * CRITICAL: never remove a key that is already referenced by useDynamicCopy() — doing so
 * just makes that hook fall back to its hardcoded fallback, it won't break anything.
 */

export interface DefaultCopyEntry {
  key: string;
  value: string;
  description: string;
}

export const DEFAULT_COPY: DefaultCopyEntry[] = [

  // ── Dashboard ──────────────────────────────────────────────────────────────────
  {
    key: 'dashboard.title',
    value: 'Dashboard',
    description: 'Paginatitel van de overzichtspagina',
  },
  {
    key: 'dashboard.subtitle',
    value: 'Welkom terug! Hier is een overzicht van je accommodatie.',
    description: 'Ondertitel op de dashboard overzichtspagina',
  },

  // ── Boekingen ──────────────────────────────────────────────────────────────────
  {
    key: 'bookings.header.title',
    value: 'Boekingen',
    description: 'Paginatitel van de boekingenpagina',
  },
  {
    key: 'bookings.subtitle',
    value: 'Beheer al je reserveringen',
    description: 'Ondertitel op de boekingenpagina',
  },

  // ── Agenda ─────────────────────────────────────────────────────────────────────
  {
    key: 'agenda.header.title',
    value: 'Agenda',
    description: 'Paginatitel van de agendapagina',
  },
  {
    key: 'agenda.header.subtitle',
    value: 'Beheer je beschikbaarheid en boekingen',
    description: 'Ondertitel op de agendapagina',
  },
  {
    key: 'agenda.header.tooltip',
    value: 'Klik op een dag om deze te blokkeren of deblokkeren. Boekingen worden automatisch gemarkeerd.',
    description: 'Tooltip bij het informaticoon op de agendapagina',
  },
  {
    key: 'agenda.filter.room_label',
    value: 'Kamer:',
    description: 'Label voor het kamerselectieveld in de agenda',
  },
  {
    key: 'agenda.button.sync',
    value: 'Agenda synchroniseren',
    description: 'Knoptekst voor agenda synchronisatie (als er nog geen export-URL is)',
  },
  {
    key: 'agenda.button.google',
    value: 'Google Agenda',
    description: 'Knoptekst voor Google Calendar koppeling',
  },
  {
    key: 'agenda.button.apple',
    value: 'Apple Agenda',
    description: 'Knoptekst voor Apple Calendar koppeling',
  },
  {
    key: 'agenda.calendar.blocked',
    value: 'Geblokkeerd',
    description: 'Label op geblokkeerde dagen in de kalender',
  },
  {
    key: 'agenda.legend.booked',
    value: 'Geboekt',
    description: 'Legenda-item voor geboekte dagen',
  },
  {
    key: 'agenda.legend.today',
    value: 'Vandaag',
    description: 'Legenda-item voor de huidige dag',
  },
  {
    key: 'agenda.events.title',
    value: 'Aankomende Events',
    description: 'Koptekst van het events-paneel rechts van de kalender',
  },
  {
    key: 'agenda.events.empty_month',
    value: 'Geen events deze maand',
    description: 'Lege staat in het events-paneel wanneer er geen events zijn',
  },
  {
    key: 'agenda.events.select_room',
    value: 'Selecteer een kamer',
    description: 'Lege staat in het events-paneel wanneer nog geen kamer geselecteerd is',
  },
  {
    key: 'agenda.events.checkin',
    value: 'Check-in',
    description: 'Label voor check-in events in het events-paneel',
  },
  {
    key: 'agenda.events.checkout',
    value: 'Check-out',
    description: 'Label voor check-out events in het events-paneel',
  },
  {
    key: 'agenda.events.cleaning',
    value: 'Kamer schoonmaak',
    description: 'Titel van het schoonmaak-placeholder item in het events-paneel',
  },
  {
    key: 'agenda.events.cleaning_all',
    value: 'Alle kamers',
    description: 'Subtekst bij het schoonmaak-placeholder item',
  },
  {
    key: 'agenda.events.today',
    value: 'Vandaag',
    description: 'Label "Vandaag" bij het schoonmaak-placeholder item',
  },
  {
    key: 'agenda.button.new_event',
    value: 'Nieuwe Event',
    description: 'Knoptekst om een nieuwe blokkering aan te maken',
  },
  {
    key: 'agenda.modal.sync_title',
    value: 'Agenda synchroniseren',
    description: 'Titel van het agenda-synchronisatie modal',
  },
  {
    key: 'agenda.modal.sync_close',
    value: 'Sluiten',
    description: 'Sluitknop in het agenda-synchronisatie modal',
  },
  {
    key: 'agenda.modal.block_title',
    value: 'Datums blokkeren',
    description: 'Titel van het datums-blokkeren modal',
  },
  {
    key: 'agenda.modal.block_from',
    value: 'Van',
    description: 'Label voor de startdatum in het blokkeren-modal',
  },
  {
    key: 'agenda.modal.block_until',
    value: 'Tot en met',
    description: 'Label voor de einddatum in het blokkeren-modal',
  },
  {
    key: 'agenda.modal.block_reason',
    value: 'Reden (optioneel)',
    description: 'Label voor het redenenveld in het blokkeren-modal',
  },
  {
    key: 'agenda.modal.cancel',
    value: 'Annuleren',
    description: 'Annuleerknop in modals op de agendapagina',
  },
  {
    key: 'agenda.modal.block_confirm',
    value: 'Blokkeer datums',
    description: 'Bevestigingsknop in het blokkeren-modal',
  },
  {
    key: 'agenda.modal.block_pending',
    value: 'Blokkeren…',
    description: 'Laadtekst op de bevestigingsknop terwijl de blokkering wordt opgeslagen',
  },
  {
    key: 'agenda.modal.block_error',
    value: 'Blokkeren mislukt. Probeer opnieuw.',
    description: 'Foutmelding in het blokkeren-modal bij een API-fout',
  },

  // ── Emails ─────────────────────────────────────────────────────────────────────
  {
    key: 'emails.header.title',
    value: 'Emails',
    description: 'Paginatitel van de e-mailsjablonenpagina',
  },
  {
    key: 'emails.header.subtitle',
    value: 'Beheer je email communicatie',
    description: 'Ondertitel op de e-mailsjablonenpagina',
  },
  {
    key: 'emails.stat.sent',
    value: 'Verzonden',
    description: 'Label voor de "Verzonden" statistiekkaart',
  },
  {
    key: 'emails.stat.sent_sublabel',
    value: 'Totaal verstuurd',
    description: 'Ondertekst bij de "Verzonden" statistiekkaart',
  },
  {
    key: 'emails.stat.failed',
    value: 'Mislukt',
    description: 'Label voor de "Mislukt" statistiekkaart',
  },
  {
    key: 'emails.stat.failed_sublabel',
    value: 'Leveringsfouten',
    description: 'Ondertekst bij de "Mislukt" statistiekkaart',
  },
  {
    key: 'emails.stat.total',
    value: 'Totaal',
    description: 'Label voor de "Totaal" statistiekkaart',
  },
  {
    key: 'emails.stat.total_sublabel',
    value: 'Alle emails',
    description: 'Ondertekst bij de "Totaal" statistiekkaart',
  },
  {
    key: 'emails.stat.templates',
    value: 'Templates',
    description: 'Label voor de "Templates" statistiekkaart',
  },
  {
    key: 'emails.stat.templates_sub',
    value: 'Aangepast',
    description: 'Ondertekst bij de "Templates" statistiekkaart',
  },
  {
    key: 'emails.filter.all_statuses',
    value: 'Alle statussen',
    description: 'Standaardoptie in het statusfilter op de e-mailpagina',
  },
  {
    key: 'emails.filter.sent',
    value: 'Verzonden',
    description: 'Filteroptie "Verzonden" op de e-mailpagina',
  },
  {
    key: 'emails.filter.planned',
    value: 'Gepland',
    description: 'Filteroptie "Gepland" op de e-mailpagina',
  },
  {
    key: 'emails.recent.title',
    value: 'Recente Emails',
    description: 'Koptekst van de recente e-mailsectie',
  },
  {
    key: 'emails.button.edit_template',
    value: 'Sjabloon bewerken →',
    description: 'Knoptekst om een e-mailsjabloon te bewerken',
  },
  {
    key: 'emails.footer.note',
    value: 'Niet-aangepaste templates gebruiken de DirectBnB standaard e-mails. U kunt altijd resetten naar de standaard.',
    description: 'Voetnoot onderaan de e-mailsjablonenpagina',
  },

  // ── Uitbetalingen ──────────────────────────────────────────────────────────────
  {
    key: 'payouts.header.title',
    value: 'Uitbetalingen',
    description: 'Paginatitel van de uitbetalingenpagina',
  },
  {
    key: 'payouts.header.subtitle',
    value: 'Ontvang betalingen direct op je bankrekening',
    description: 'Ondertitel op de uitbetalingenpagina',
  },
  {
    key: 'payouts.header.tooltip',
    value: 'Koppel je bankrekening via Stripe om automatisch uitbetalingen te ontvangen na elke check-in.',
    description: 'Tooltip bij het informaticoon op de uitbetalingenpagina',
  },
  {
    key: 'payouts.stat.this_year',
    value: 'Totaal dit jaar',
    description: 'Label voor de jaaromzet statistiekkaart',
  },
  {
    key: 'payouts.stat.this_month',
    value: 'Deze maand',
    description: 'Label voor de maandomzet statistiekkaart',
  },
  {
    key: 'payouts.stat.pending',
    value: 'In behandeling',
    description: 'Label voor de uitstaande betalingen statistiekkaart',
  },
  {
    key: 'payouts.stat.pending_sublabel',
    value: 'Wordt uitbetaald na check-in',
    description: 'Ondertekst bij de "In behandeling" statistiekkaart',
  },
  {
    key: 'payouts.stat.next_payout',
    value: 'Volgende uitbetaling',
    description: 'Label voor de volgende uitbetaling statistiekkaart',
  },
  {
    key: 'payouts.stat.next_sub_yes',
    value: 'Verwachte aankomstdatum',
    description: 'Ondertekst bij "Volgende uitbetaling" wanneer er een datum bekend is',
  },
  {
    key: 'payouts.stat.next_sub_no',
    value: 'Geen uitbetaling gepland',
    description: 'Ondertekst bij "Volgende uitbetaling" wanneer er geen datum is',
  },
  {
    key: 'payouts.chart.title',
    value: 'Inkomsten overzicht',
    description: 'Koptekst van de inkomstengrafieksectie',
  },
  {
    key: 'payouts.history.title',
    value: 'Recente uitbetalingen',
    description: 'Koptekst van de uitbetalingsgeschiedenissectie',
  },
  {
    key: 'payouts.history.export',
    value: 'Exporteer →',
    description: 'Knoptekst voor CSV-export van uitbetalingen',
  },
  {
    key: 'payouts.history.empty_title',
    value: 'Nog geen uitbetalingen',
    description: 'Lege-staat titel in de uitbetalingsgeschiedenissectie',
  },
  {
    key: 'payouts.history.empty_sub',
    value: 'Zodra er boekingen zijn uitbetaald, verschijnen ze hier.',
    description: 'Lege-staat ondertitel in de uitbetalingsgeschiedenissectie',
  },

  // ── Instellingen ───────────────────────────────────────────────────────────────
  {
    key: 'settings.header.title',
    value: 'Instellingen',
    description: 'Paginatitel van de instellingenpagina',
  },
  {
    key: 'settings.header.subtitle',
    value: 'Beheer je B&B en account voorkeuren',
    description: 'Ondertitel op de instellingenpagina',
  },
  {
    key: 'settings.tab.bnb',
    value: 'B&B Instellingen',
    description: 'Tabnaam voor B&B-instellingen',
  },
  {
    key: 'settings.tab.account',
    value: 'Account',
    description: 'Tabnaam voor accountinstellingen',
  },
  {
    key: 'settings.tab.meldingen',
    value: 'Meldingen',
    description: 'Tabnaam voor meldingsinstellingen',
  },
  {
    key: 'settings.tab.beveiliging',
    value: 'Beveiliging & Betalingen',
    description: 'Tabnaam voor beveiliging- en betalingsinstellingen',
  },

  // ── Kamers ─────────────────────────────────────────────────────────────────────
  {
    key: 'rooms.header.title',
    value: 'Kamers',
    description: 'Paginatitel van de kamerspagina',
  },
  {
    key: 'rooms.header.subtitle',
    value: 'Beheer je accommodaties',
    description: 'Ondertitel op de kamerspagina',
  },
  {
    key: 'rooms.header.tooltip',
    value: "Beheer je kamers en accommodaties. Klik op 'Bewerken' om prijs, beschrijving en voorzieningen aan te passen.",
    description: 'Tooltip bij het informaticoon op de kamerspagina',
  },
  {
    key: 'rooms.button.new_room',
    value: 'Nieuwe Kamer',
    description: 'Knoptekst voor het toevoegen van een nieuwe kamer',
  },
  {
    key: 'rooms.empty.title',
    value: 'Nog geen kamers',
    description: 'Lege-staat titel op de kamerspagina',
  },
  {
    key: 'rooms.empty.subtitle',
    value: 'Voeg je eerste kamer toe om boekingen te ontvangen.',
    description: 'Lege-staat ondertitel op de kamerspagina',
  },
  {
    key: 'rooms.empty.button',
    value: 'Eerste kamer toevoegen',
    description: 'Knoptekst in de lege staat van de kamerspagina',
  },
  {
    key: 'rooms.filter.all_statuses',
    value: 'Alle statussen',
    description: 'Standaardoptie in het statusfilter op de kamerspagina',
  },
  {
    key: 'rooms.filter.all_types',
    value: 'Alle types',
    description: 'Standaardoptie in het typefilter op de kamerspagina',
  },
  {
    key: 'rooms.filter.clear',
    value: 'Wis filters',
    description: 'Knoptekst om alle filters op de kamerspagina te wissen',
  },
  {
    key: 'rooms.card.per_night',
    value: 'per nacht',
    description: 'Eenheidslabel naast de kamerprijs',
  },
  {
    key: 'rooms.card.amenities',
    value: 'Voorzieningen',
    description: 'Label boven de voorzieningenlijst op een kamerkaart',
  },
  {
    key: 'rooms.button.edit',
    value: 'Bewerken',
    description: 'Knoptekst op de bewerkknop van een kamerkaart',
  },
  {
    key: 'rooms.button.details',
    value: 'Details',
    description: 'Knoptekst op de detailsknop van een kamerkaart',
  },
  {
    key: 'rooms.button.edit_property',
    value: 'Accommodatie bewerken →',
    description: 'Linktekst om de accommodatie te bewerken boven de kamerkaarten',
  },

  // ── Gasten ─────────────────────────────────────────────────────────────────────
  {
    key: 'guests.header.title',
    value: 'Gasten',
    description: 'Paginatitel van de gastenpagina',
  },
  {
    key: 'guests.subtitle',
    value: 'Overzicht van al je gasten',
    description: 'Ondertitel op de gastenpagina',
  },

  // ── Onboarding popups ──────────────────────────────────────────────────────────
  // Each page gets a title + description shown once on first visit.
  {
    key: 'dashboard.onboarding.title',
    value: 'Welkom bij je Dashboard',
    description: 'Titel van de onboarding popup op de dashboardpagina',
  },
  {
    key: 'dashboard.onboarding.description',
    value: 'Dit is jouw command center. Hier zie je een live overzicht van openstaande boekingen, je inkomsten deze maand en alle recente activiteit in één oogopslag.',
    description: 'Beschrijving in de onboarding popup op de dashboardpagina',
  },
  {
    key: 'bookings.onboarding.title',
    value: 'Beheer al je boekingen',
    description: 'Titel van de onboarding popup op de boekingenpagina',
  },
  {
    key: 'bookings.onboarding.description',
    value: 'Nieuwe boekingsverzoeken verschijnen bovenaan in het geel. Accepteer of weiger ze direct. Je kunt ook handmatig boekingen aanmaken en betalingslinks versturen.',
    description: 'Beschrijving in de onboarding popup op de boekingenpagina',
  },
  {
    key: 'agenda.onboarding.title',
    value: 'Je beschikbaarheidskalender',
    description: 'Titel van de onboarding popup op de agendapagina',
  },
  {
    key: 'agenda.onboarding.description',
    value: 'Klik op een dag om deze te blokkeren of deblokkeren. Boekingen zijn automatisch zichtbaar in de kalender. Synchroniseer met Google of Apple Agenda via de knoppen bovenaan.',
    description: 'Beschrijving in de onboarding popup op de agendapagina',
  },
  {
    key: 'rooms.onboarding.title',
    value: 'Je kamers & accommodaties',
    description: 'Titel van de onboarding popup op de kamerspagina',
  },
  {
    key: 'rooms.onboarding.description',
    value: "Hier beheer je al jouw kamers. Klik op 'Bewerken' om de prijs, beschrijving of voorzieningen aan te passen. Zet een accommodatie online of offline via de publicatieknop.",
    description: 'Beschrijving in de onboarding popup op de kamerspagina',
  },
  {
    key: 'emails.onboarding.title',
    value: 'Automatische e-mailcommunicatie',
    description: 'Titel van de onboarding popup op de e-mailpagina',
  },
  {
    key: 'emails.onboarding.description',
    value: 'DirectBnB verstuurt automatisch e-mails bij boekingen en bevestigingen. Pas de inhoud van de sjablonen hier aan voor een persoonlijke uitstraling. Je kunt altijd resetten naar de standaard.',
    description: 'Beschrijving in de onboarding popup op de e-mailpagina',
  },
  {
    key: 'payouts.onboarding.title',
    value: 'Automatische uitbetalingen',
    description: 'Titel van de onboarding popup op de uitbetalingenpagina',
  },
  {
    key: 'payouts.onboarding.description',
    value: 'Koppel eenmalig je bankrekening via Stripe. Daarna ontvang je betalingen automatisch na elke check-in — binnen 2 werkdagen op je rekening. Volledig veilig en geautomatiseerd.',
    description: 'Beschrijving in de onboarding popup op de uitbetalingenpagina',
  },
  {
    key: 'settings.onboarding.title',
    value: 'Je B&B instellingen',
    description: 'Titel van de onboarding popup op de instellingenpagina',
  },
  {
    key: 'settings.onboarding.description',
    value: 'Stel hier je accommodatiegegevens in, beheer je accountprofiel, configureer meldingen en regel beveiliging en betalingen. Wijzigingen worden direct opgeslagen.',
    description: 'Beschrijving in de onboarding popup op de instellingenpagina',
  },

  // ── Uitbetalingen — info box ───────────────────────────────────────────────
  {
    key: 'payouts.info.payout_timing',
    value: 'Let op: Elke uitbetaling wordt per individuele boeking verwerkt op het moment dat de gast is ingecheckt.',
    description: 'Informatiemelding bovenaan de uitbetalingenpagina over het tijdstip van uitbetalingen',
  },

  // ── E-mail editor — multi-step tour (email-editor pageKey) ─────────────────
  {
    key: 'email-editor.onboarding.title',
    value: 'Welkom bij de editor',
    description: 'Titel van de onboarding popup op de e-mail editor pagina (stap 1 fallback)',
  },
  {
    key: 'email-editor.onboarding.description',
    value: 'Hier pas je de tekst en opmaak van je automatische e-mails aan. Wijzigingen worden automatisch opgeslagen — je hoeft niets handmatig te doen.',
    description: 'Beschrijving in de onboarding popup op de e-mail editor pagina (stap 1 fallback)',
  },
  {
    key: 'email-editor.onboarding.steps',
    value: JSON.stringify([
      {
        title: 'Welkom bij de editor',
        description: 'Hier pas je de tekst en opmaak van je automatische e-mails aan. Gebruik de toolbar om koppen, afbeeldingen en knoppen toe te voegen.',
      },
      {
        title: 'Kies je variabelen',
        description: 'Rechts in de editor vind je dynamische variabelen zoals {{guest_name}} en {{property_name}}. Klik op een variabele om hem in te voegen — hij wordt automatisch ingevuld bij elk verstuurde e-mail.',
      },
      {
        title: 'Sla automatisch op',
        description: 'Je werk wordt automatisch opgeslagen na 4 seconden inactiviteit. Je ziet een "Opgeslagen" melding bovenin. Klaar? Sluit de editor en je wijzigingen zijn actief.',
      },
    ]),
    description: 'Multi-step tour stappen JSON voor de e-mail editor (3 stappen)',
  },
];
