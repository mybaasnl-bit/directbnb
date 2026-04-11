import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden — DirectBnB',
  description: 'De algemene voorwaarden van DirectBnB voor verhuurders en gasten.',
};

const LAST_UPDATED = '1 januari 2025';
const COMPANY = 'DirectBnB B.V.';
const CONTACT_EMAIL = 'support@directbnb.nl';
const KVK = '99999999'; // ← vervangen door echt KvK-nummer
const BTW = 'NL999999999B01'; // ← vervangen door echt BTW-nummer

export default function AlgemeneVoorwaardenPage() {
  return (
    <article>
      {/* Page header */}
      <div className="mb-10 pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 bg-brand-light text-brand-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Juridisch document
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Algemene Voorwaarden</h1>
        <p className="text-slate-500 text-sm">
          Versie 1.0 &nbsp;·&nbsp; Laatst bijgewerkt: {LAST_UPDATED}
        </p>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm text-amber-800">
            <strong>Belangrijke mededeling:</strong> DirectBnB treedt uitsluitend op als
            technisch platform en marktplaats. De huurovereenkomst voor een accommodatie
            wordt gesloten <strong>tussen de gast en de verhuurder</strong>. DirectBnB is
            geen partij in die overeenkomst.
          </p>
        </div>
      </div>

      <div className="space-y-10 text-slate-700">

        {/* Artikel 1 */}
        <Section id="definities" title="Artikel 1 — Definities">
          <p>In deze Algemene Voorwaarden worden de volgende begrippen gehanteerd:</p>
          <dl className="mt-4 space-y-3">
            <DefinitionRow term="DirectBnB">
              {COMPANY}, gevestigd in Nederland, KvK-nummer {KVK}, BTW-nummer {BTW}.
              DirectBnB exploiteert het gelijknamige online platform waarop verhuurders
              hun accommodaties aanbieden en gasten reserveringen kunnen plaatsen.
            </DefinitionRow>
            <DefinitionRow term="Platform">
              De website, mobiele applicatie en/of API-diensten van DirectBnB waarop
              verhuurders en gasten met elkaar in contact komen.
            </DefinitionRow>
            <DefinitionRow term="Verhuurder">
              De natuurlijke persoon of rechtspersoon die via het Platform één of meer
              accommodaties aanbiedt voor tijdelijke verhuur.
            </DefinitionRow>
            <DefinitionRow term="Gast">
              De natuurlijke persoon die via het Platform een accommodatie boekt bij een
              Verhuurder.
            </DefinitionRow>
            <DefinitionRow term="Huurovereenkomst">
              De overeenkomst die tot stand komt tussen de Verhuurder en de Gast op het
              moment dat een reservering door de Verhuurder wordt bevestigd.
            </DefinitionRow>
            <DefinitionRow term="Platformdienst">
              De technische en administratieve dienstverlening van DirectBnB, bestaande
              uit het beschikbaar stellen van het Platform, het faciliteren van
              betalingstransacties, het versturen van bevestigingsmails en het bieden van
              klantenondersteuning.
            </DefinitionRow>
          </dl>
        </Section>

        {/* Artikel 2 */}
        <Section id="rol-directbnb" title="Artikel 2 — De rol van DirectBnB">
          <p>
            DirectBnB biedt uitsluitend een technisch platform aan waarop Verhuurders en
            Gasten met elkaar in contact kunnen komen. DirectBnB is <strong>geen partij</strong> bij
            de Huurovereenkomst die tot stand komt tussen de Gast en de Verhuurder.
          </p>
          <p className="mt-3">
            DirectBnB is niet verantwoordelijk voor de kwaliteit, veiligheid, legaliteit of
            beschikbaarheid van de aangeboden accommodaties, noch voor de nakoming van
            verplichtingen die voortvloeien uit de Huurovereenkomst. DirectBnB vervult
            uitsluitend de rol van technisch tussenpersoon en betalingsintermediair.
          </p>
          <p className="mt-3">
            Eventuele geschillen over de verblijfsperiode, de staat van de accommodatie of
            andere aspecten van de verhuur dienen te worden opgelost tussen de Gast en de
            Verhuurder onderling.
          </p>
        </Section>

        {/* Artikel 3 */}
        <Section id="account" title="Artikel 3 — Account en registratie">
          <p>
            Om gebruik te maken van het Platform als Verhuurder of als geauthenticeerde
            Gast is het aanmaken van een account vereist. Bij registratie verstrekt de
            gebruiker accurate, actuele en volledige informatie.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-outside ml-5">
            <li>
              De gebruiker is zelf verantwoordelijk voor de vertrouwelijkheid van zijn of
              haar inloggegevens.
            </li>
            <li>
              DirectBnB behoudt zich het recht voor om accounts zonder opgaaf van redenen
              op te schorten of te verwijderen, in het bijzonder bij vermoeden van fraude,
              misbruik of overtreding van deze voorwaarden.
            </li>
            <li>
              Het is niet toegestaan een account over te dragen aan een derde partij zonder
              voorafgaande schriftelijke toestemming van DirectBnB.
            </li>
          </ul>
        </Section>

        {/* Artikel 4 */}
        <Section id="reserveringen" title="Artikel 4 — Reserveringen en de Huurovereenkomst">
          <p>
            Een reservering via het Platform vormt een bindend aanbod van de Gast aan de
            Verhuurder. De Huurovereenkomst komt tot stand op het moment dat de Verhuurder
            de reservering expliciet bevestigt via het Platform.
          </p>
          <p className="mt-3">
            De specifieke voorwaarden van de verblijfsperiode — waaronder het aantal gasten,
            de duur van het verblijf, huisregels en de huurprijs — worden bepaald door de
            Verhuurder en zijn kenbaar gemaakt op de accommodatiepagina op het moment van
            boeking.
          </p>
          <p className="mt-3">
            DirectBnB behoudt zich het recht voor een reservering te weigeren of te
            annuleren indien er gegronde aanwijzingen zijn voor fraude, misbruik of
            overtreding van deze voorwaarden.
          </p>
        </Section>

        {/* Artikel 5 */}
        <Section id="betalingen" title="Artikel 5 — Betalingen en uitbetalingen">
          <p>
            Betalingen via het Platform worden verwerkt door <strong>Stripe</strong>,
            een gecertificeerde betalingsdienstaanbieder (PSD2-gecompliant). Door gebruik
            te maken van de betalingsfunctionaliteit van het Platform, aanvaardt de Gast
            tevens de toepasselijke voorwaarden van Stripe.
          </p>

          <Subsection title="5.1 Betaling door de Gast">
            <p>
              De Gast betaalt de overeengekomen huurprijs bij het bevestigen van de
              boeking. Het bedrag wordt door Stripe in bewaring gehouden namens DirectBnB
              totdat de verblijfsperiode ingaat.
            </p>
          </Subsection>

          <Subsection title="5.2 Uitbetaling aan de Verhuurder">
            <p>
              DirectBnB maakt het huurgeldbedrag — verminderd met de toepasselijke
              platformvergoeding — over aan de Verhuurder <strong>na de check-in datum</strong>{' '}
              van de Gast. Dit beschermt de Gast tegen niet-nakoming en geeft de Verhuurder
              zekerheid over ontvangst van betaling.
            </p>
            <p className="mt-2">
              De platformvergoeding bedraagt een percentage van de totale huurprijs. Het
              exacte percentage is kenbaar gemaakt in de accountinstellingen van de
              Verhuurder.
            </p>
          </Subsection>

          <Subsection title="5.3 Valuta en kosten">
            <p>
              Alle bedragen op het Platform zijn weergegeven in euro&apos;s (EUR) inclusief
              eventueel verschuldigde belastingen, tenzij anders vermeld. Kosten voor
              betalingstransacties zijn opgenomen in de platformvergoeding.
            </p>
          </Subsection>
        </Section>

        {/* Artikel 6 */}
        <Section id="annulering" title="Artikel 6 — Annulering en restitutie">
          <p>
            Het annuleringsbeleid wordt primair vastgesteld door de Verhuurder en is
            kenbaar gemaakt op de accommodatiepagina. DirectBnB faciliteert de uitvoering
            van dit beleid maar is zelf geen partij bij de annulering.
          </p>

          <Subsection title="6.1 Annulering door de Gast">
            <p>
              Indien de Gast een bevestigde reservering wenst te annuleren, gelden de
              annuleringsvoorwaarden van de betreffende Verhuurder. Een terugbetaling
              vindt plaats in overeenstemming met die voorwaarden en wordt verwerkt via
              Stripe.
            </p>
          </Subsection>

          <Subsection title="6.2 Annulering door de Verhuurder">
            <p>
              Indien een Verhuurder een bevestigde reservering annuleert, is DirectBnB
              gerechtigd de Gast het volledig betaalde bedrag terug te storten.
              DirectBnB behoudt zich tevens het recht voor een vergoeding te vorderen
              van de Verhuurder voor geleden schade en administratiekosten.
            </p>
          </Subsection>

          <Subsection title="6.3 Overmacht">
            <p>
              In geval van overmacht (force majeure) — waaronder maar niet beperkt tot
              natuurrampen, pandemieën, of overheidsmaatregelen die verblijf onmogelijk
              maken — kunnen de gebruikelijke annuleringsvoorwaarden buiten toepassing
              worden gelaten. DirectBnB neemt in dergelijke gevallen een beslissing naar
              redelijkheid en billijkheid.
            </p>
          </Subsection>
        </Section>

        {/* Artikel 7 */}
        <Section id="aansprakelijkheid" title="Artikel 7 — Aansprakelijkheid">
          <p>
            DirectBnB is uitsluitend aansprakelijk voor schade die het directe gevolg is
            van opzet of grove nalatigheid van DirectBnB zelf. Voor overige schade is
            aansprakelijkheid uitdrukkelijk uitgesloten.
          </p>
          <p className="mt-3">
            <strong>DirectBnB is in het bijzonder niet aansprakelijk voor:</strong>
          </p>
          <ul className="mt-3 space-y-2 list-disc list-outside ml-5">
            <li>
              Schade, letsel of verlies tijdens een verblijf in een via het Platform
              geboekte accommodatie;
            </li>
            <li>
              Onjuiste of misleidende informatie verstrekt door de Verhuurder over de
              accommodatie;
            </li>
            <li>
              Niet-nakoming van de Huurovereenkomst door de Verhuurder of de Gast;
            </li>
            <li>
              Technische storingen, cyberaanvallen of andere verstoringen van het Platform
              die buiten de directe invloedssfeer van DirectBnB vallen;
            </li>
            <li>
              Gevolgschade, winstderving, reputatieschade of indirecte schade van welke
              aard dan ook.
            </li>
          </ul>
          <p className="mt-3">
            Indien DirectBnB ondanks het voorgaande aansprakelijk wordt gehouden, is de
            totale aansprakelijkheid beperkt tot het bedrag dat DirectBnB als
            platformvergoeding heeft ontvangen in verband met de betreffende transactie,
            tot een maximum van € 500,– per incident.
          </p>
        </Section>

        {/* Artikel 8 */}
        <Section id="verplichtingen-verhuurder" title="Artikel 8 — Verplichtingen van de Verhuurder">
          <p>De Verhuurder garandeert en staat er voor in dat:</p>
          <ul className="mt-3 space-y-2 list-disc list-outside ml-5">
            <li>
              Hij of zij juridisch bevoegd is de aangeboden accommodatie te verhuren en
              beschikt over alle vereiste vergunningen, registraties en toestemmingen
              (waaronder eventuele gemeentelijke toeristische verhuurvergunningen);
            </li>
            <li>
              De informatie op de accommodatiepagina — foto&apos;s, beschrijvingen,
              faciliteiten, prijzen — accuraat, actueel en niet misleidend is;
            </li>
            <li>
              De accommodatie schoon, veilig en in de beschreven staat beschikbaar is bij
              aankomst van de Gast;
            </li>
            <li>
              Hij of zij beschikt over een adequate aansprakelijkheidsverzekering die
              dekking biedt voor schade veroorzaakt door of aan Gasten.
            </li>
          </ul>
          <p className="mt-3">
            Overtreding van deze garanties kan leiden tot onmiddellijke opschorting of
            verwijdering van het account, zonder dat DirectBnB gehouden is enige
            vergoeding te betalen.
          </p>
        </Section>

        {/* Artikel 9 */}
        <Section id="misbruik" title="Artikel 9 — Verboden gebruik en misbruik">
          <p>Het is gebruikers van het Platform uitdrukkelijk verboden om:</p>
          <ul className="mt-3 space-y-2 list-disc list-outside ml-5">
            <li>
              Valse, misleidende of frauduleuze informatie te verstrekken bij registratie
              of in het gebruik van het Platform;
            </li>
            <li>
              Betalingen te verwerken buiten het Platform om, teneinde de
              platformvergoeding te omzeilen;
            </li>
            <li>
              Het Platform te gebruiken voor illegale activiteiten, waaronder witwassen,
              mensenhandel of het verhuren van accommodaties zonder de vereiste
              vergunningen;
            </li>
            <li>
              Geautomatiseerde scripts, bots of scraping-tools te gebruiken om gegevens
              van het Platform te verzamelen;
            </li>
            <li>
              De technische infrastructuur van DirectBnB te verstoren of te saboteren.
            </li>
          </ul>
          <p className="mt-3">
            DirectBnB behoudt zich het recht voor om bij constatering van verboden gebruik
            onmiddellijk te handelen, waaronder het opschorten van accounts, het
            terugvorderen van uitbetalingen en het doen van aangifte bij de bevoegde
            autoriteiten.
          </p>
        </Section>

        {/* Artikel 10 */}
        <Section id="intellectueel-eigendom" title="Artikel 10 — Intellectueel eigendom">
          <p>
            Alle rechten van intellectueel eigendom met betrekking tot het Platform — waaronder
            de software, het ontwerp, de merkidentiteit en de inhoud — berusten bij
            DirectBnB of haar licentiegevers. Gebruik van het Platform geeft geen enkel
            recht op het kopiëren, reproduceren of distribueren van enig onderdeel daarvan.
          </p>
          <p className="mt-3">
            Verhuurders verlenen DirectBnB een niet-exclusief, royaltyvrij recht om de
            door hen op het Platform geplaatste inhoud (waaronder foto&apos;s en beschrijvingen)
            te gebruiken voor de promotie van het Platform en de betreffende accommodatie.
          </p>
        </Section>

        {/* Artikel 11 */}
        <Section id="wijzigingen" title="Artikel 11 — Wijzigingen in het Platform en de voorwaarden">
          <p>
            DirectBnB behoudt zich het recht voor deze Algemene Voorwaarden te wijzigen.
            Wezenlijke wijzigingen worden minimaal 14 dagen van tevoren aangekondigd via
            e-mail of een prominente mededeling op het Platform. Voortgezet gebruik van
            het Platform na de ingangsdatum van de gewijzigde voorwaarden geldt als
            aanvaarding daarvan.
          </p>
          <p className="mt-3">
            DirectBnB behoudt zich tevens het recht voor het Platform (tijdelijk) buiten
            gebruik te stellen voor onderhoud, updates of andere redenen, zonder dat
            hieraan aansprakelijkheid kan worden ontleend.
          </p>
        </Section>

        {/* Artikel 12 */}
        <Section id="toepasselijk-recht" title="Artikel 12 — Toepasselijk recht en geschillenbeslechting">
          <p>
            Op deze Algemene Voorwaarden en alle overeenkomsten die via het Platform tot
            stand komen, is uitsluitend <strong>Nederlands recht</strong> van toepassing.
          </p>
          <p className="mt-3">
            Geschillen worden in eerste instantie voorgelegd aan de bevoegde rechter in
            het arrondissement Amsterdam. Voor consumenten (Gasten) geldt dat zij tevens
            een klacht kunnen indienen bij de Geschillencommissie of bij de Europese
            ODR-commissie via{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Section>

        {/* Artikel 13 */}
        <Section id="contact" title="Artikel 13 — Contact">
          <p>
            Voor vragen over deze Algemene Voorwaarden kunt u contact opnemen met
            DirectBnB via{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {COMPANY} &nbsp;·&nbsp; KvK {KVK} &nbsp;·&nbsp; BTW {BTW}
          </p>
        </Section>

      </div>
    </article>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
        {title}
      </h2>
      <div className="space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 pl-4 border-l-2 border-slate-200">
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
      <div className="space-y-2 leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

function DefinitionRow({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 text-sm">
      <dt className="font-semibold text-slate-900 pt-0.5">{term}</dt>
      <dd className="text-slate-600 leading-relaxed">{children}</dd>
    </div>
  );
}
