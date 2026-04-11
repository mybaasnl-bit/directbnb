import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacybeleid — DirectBnB',
  description:
    'Hoe DirectBnB omgaat met uw persoonsgegevens, conform de AVG/GDPR.',
};

const LAST_UPDATED = '1 januari 2025';
const COMPANY = 'DirectBnB B.V.';
const CONTACT_EMAIL = 'privacy@directbnb.nl';
const KVK = '99999999'; // ← vervangen door echt KvK-nummer

export default function PrivacybeleidPage() {
  return (
    <article>
      {/* Page header */}
      <div className="mb-10 pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 bg-brand-light text-brand-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Juridisch document
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacybeleid</h1>
        <p className="text-slate-500 text-sm">
          Versie 1.0 &nbsp;·&nbsp; Laatst bijgewerkt: {LAST_UPDATED}
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <p className="text-sm text-blue-800">
            DirectBnB verwerkt uw persoonsgegevens conform de{' '}
            <strong>Algemene Verordening Gegevensbescherming (AVG / GDPR)</strong>.
            In dit document leggen wij uit welke gegevens wij verzamelen, waarom, hoe
            lang we ze bewaren en welke rechten u heeft.
          </p>
        </div>
      </div>

      <div className="space-y-10 text-slate-700">

        {/* Artikel 1 */}
        <Section id="verwerkingsverantwoordelijke" title="Artikel 1 — Verwerkingsverantwoordelijke">
          <p>
            De verwerkingsverantwoordelijke in de zin van de AVG is:
          </p>
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm space-y-1">
            <p className="font-semibold text-slate-900">{COMPANY}</p>
            <p>KvK-nummer: {KVK}</p>
            <p>
              E-mail:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <p className="mt-3">
            Heeft u vragen of wilt u een recht uitoefenen (zie Artikel 9)?
            Neem dan contact op via bovenstaand e-mailadres. Wij reageren binnen 30 dagen.
          </p>
        </Section>

        {/* Artikel 2 */}
        <Section id="welke-gegevens" title="Artikel 2 — Welke persoonsgegevens verwerken wij?">
          <p>
            Wij verwerken uitsluitend persoonsgegevens die noodzakelijk zijn voor het
            leveren van onze diensten. Hieronder geven wij per categorie een overzicht.
          </p>

          <Subsection title="2.1 Accountgegevens (Verhuurders en Gasten)">
            <ul className="mt-2 space-y-1.5 list-disc list-outside ml-5">
              <li>Voornaam en achternaam</li>
              <li>E-mailadres</li>
              <li>Telefoonnummer (optioneel, door uzelf verstrekt)</li>
              <li>Voorkeurstaal</li>
              <li>IP-adres en sessiegegevens (technisch vereist)</li>
            </ul>
          </Subsection>

          <Subsection title="2.2 Boekingsgegevens">
            <ul className="mt-2 space-y-1.5 list-disc list-outside ml-5">
              <li>Check-in en check-out data</li>
              <li>Aantal gasten</li>
              <li>Bijzonderheden of wensen (indien door uzelf opgegeven)</li>
              <li>Betalingsstatus en boekingshistorie</li>
            </ul>
          </Subsection>

          <Subsection title="2.3 Accommodatiegegevens (enkel Verhuurders)">
            <ul className="mt-2 space-y-1.5 list-disc list-outside ml-5">
              <li>Naam en beschrijving van de accommodatie</li>
              <li>Adres en locatiegegevens</li>
              <li>Foto&apos;s (door uzelf geüpload)</li>
              <li>Tarieven, beschikbaarheid en huisregels</li>
            </ul>
          </Subsection>

          <Subsection title="2.4 Financiële en identiteitsgegevens (via Stripe — enkel Verhuurders)">
            <p>
              Ten behoeve van uitbetalingen zijn Verhuurders verplicht zich te
              identificeren via onze betalingspartner <strong>Stripe</strong>. Stripe
              verwerkt als zelfstandige verwerkingsverantwoordelijke de volgende
              (gevoelige) gegevens:
            </p>
            <ul className="mt-2 space-y-1.5 list-disc list-outside ml-5">
              <li>IBAN-bankrekeningnummer</li>
              <li>
                Identiteitsdocumenten (KYC-verificatie) — DirectBnB heeft hier{' '}
                <strong>geen toegang toe</strong>
              </li>
              <li>
                Bedrijfsgegevens (voor zakelijke accounts)
              </li>
            </ul>
            <p className="mt-2">
              Voor de verwerking van deze gegevens verwijzen wij naar het{' '}
              <a
                href="https://stripe.com/en-nl/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                privacybeleid van Stripe
              </a>
              . DirectBnB slaat geen paspoorten, rijbewijzen of IBAN-nummers op in
              haar eigen systemen.
            </p>
          </Subsection>

          <Subsection title="2.5 Technische en gebruiksgegevens">
            <ul className="mt-2 space-y-1.5 list-disc list-outside ml-5">
              <li>Browser- en apparaattype (via cookies)</li>
              <li>Bezochte pagina&apos;s en klikgedrag (geanonimiseerde statistieken)</li>
              <li>Foutmeldingen en crashrapporten (ten behoeve van verbetering van de dienst)</li>
            </ul>
          </Subsection>
        </Section>

        {/* Artikel 3 */}
        <Section id="doel-verwerking" title="Artikel 3 — Doeleinden en grondslagen van verwerking">
          <p>
            Wij verwerken uw persoonsgegevens uitsluitend voor welbepaalde, uitdrukkelijk
            omschreven en gerechtvaardigde doeleinden. Per doel vermelden wij de
            toepasselijke grondslag op grond van de AVG.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left font-semibold text-slate-700 px-4 py-3 border border-slate-200 rounded-tl-lg">Doel</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3 border border-slate-200">Grondslag (AVG art. 6)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <TableRow doel="Aanmaken en beheren van uw account" grondslag="Uitvoering overeenkomst (lid 1b)" />
                <TableRow doel="Verwerken van reserveringen en betalingen" grondslag="Uitvoering overeenkomst (lid 1b)" />
                <TableRow doel="Uitbetalingen aan Verhuurders via Stripe" grondslag="Uitvoering overeenkomst (lid 1b)" />
                <TableRow doel="Versturen van transactionele e-mails (boekingsbevestigingen, herinneringen)" grondslag="Uitvoering overeenkomst (lid 1b)" />
                <TableRow doel="Fraudepreventie en beveiliging van het platform" grondslag="Gerechtvaardigd belang (lid 1f)" />
                <TableRow doel="Verbetering van de dienst op basis van geanonimiseerde statistieken" grondslag="Gerechtvaardigd belang (lid 1f)" />
                <TableRow doel="Versturen van nieuwsbrieven en productnieuws" grondslag="Toestemming (lid 1a) — u kunt zich altijd afmelden" />
                <TableRow doel="Voldoen aan wettelijke bewaarplichten (fiscale administratie)" grondslag="Wettelijke verplichting (lid 1c)" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* Artikel 4 */}
        <Section id="bewaartermijnen" title="Artikel 4 — Bewaartermijnen">
          <p>
            Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor het doel
            waarvoor zij zijn verzameld, met inachtneming van wettelijke bewaarplichten.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left font-semibold text-slate-700 px-4 py-3 border border-slate-200">Categorie</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3 border border-slate-200">Bewaartermijn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <TableRow doel="Accountgegevens (actief account)" grondslag="Zolang het account actief is" />
                <TableRow doel="Accountgegevens (na verwijdering)" grondslag="30 dagen (voor herstel), daarna definitief verwijderd" />
                <TableRow doel="Boekings- en betalingsgegevens" grondslag="7 jaar (wettelijke fiscale bewaarplicht)" />
                <TableRow doel="E-mailcommunicatie en logs" grondslag="2 jaar" />
                <TableRow doel="Technische logs en IP-adressen" grondslag="90 dagen" />
                <TableRow doel="Feedbackberichten" grondslag="2 jaar, of tot verwijdering op verzoek" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* Artikel 5 */}
        <Section id="derden" title="Artikel 5 — Gegevens gedeeld met derden">
          <p>
            DirectBnB verkoopt uw persoonsgegevens nooit aan derden. Wij delen gegevens
            alleen met zorgvuldig geselecteerde verwerkers en partijen die strikt
            noodzakelijk zijn voor de dienstverlening.
          </p>
          <div className="mt-4 space-y-4">
            <ThirdPartyRow
              name="Stripe"
              role="Betalingsverwerking en KYC-verificatie"
              location="VS / EU"
              basis="Verwerkersovereenkomst + Standard Contractual Clauses"
            />
            <ThirdPartyRow
              name="Resend / e-mailprovider"
              role="Verzenden van transactionele e-mails"
              location="EU"
              basis="Verwerkersovereenkomst"
            />
            <ThirdPartyRow
              name="Neon (database)"
              role="Hosting van de applicatiedatabase"
              location="EU (AWS Frankfurt)"
              basis="Verwerkersovereenkomst"
            />
            <ThirdPartyRow
              name="Vercel"
              role="Hosting van de webapplicatie"
              location="EU"
              basis="Verwerkersovereenkomst"
            />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Alle verwerkers zijn contractueel gehouden aan de AVG en mogen uw gegevens
            uitsluitend verwerken ten behoeve van de genoemde doeleinden.
          </p>
        </Section>

        {/* Artikel 6 */}
        <Section id="cookies" title="Artikel 6 — Cookies en tracking">
          <p>
            DirectBnB maakt gebruik van cookies en vergelijkbare technologieën. Wij
            onderscheiden de volgende categorieën:
          </p>

          <Subsection title="6.1 Strikt noodzakelijke cookies">
            <p>
              Deze cookies zijn vereist voor de werking van het Platform (inlogsessie,
              beveiliging). Ze kunnen niet worden uitgeschakeld. Er is geen toestemming
              vereist.
            </p>
          </Subsection>

          <Subsection title="6.2 Functionele cookies">
            <p>
              Cookies die uw voorkeuren onthouden, zoals taalinstelling. Niet persoonlijk
              herleidbaar.
            </p>
          </Subsection>

          <Subsection title="6.3 Analytische cookies">
            <p>
              Geanonimiseerde statistieken over het gebruik van het Platform, uitsluitend
              ten behoeve van verbetering van de dienst. Wij gebruiken geen cookies van
              advertentienetwerken.
            </p>
          </Subsection>

          <p className="mt-4 text-sm text-slate-500">
            U kunt cookies beheren via de instellingen van uw browser. Het uitschakelen
            van cookies kan de functionaliteit van het Platform beperken.
          </p>
        </Section>

        {/* Artikel 7 */}
        <Section id="beveiliging" title="Artikel 7 — Beveiliging">
          <p>
            DirectBnB neemt passende technische en organisatorische maatregelen om uw
            persoonsgegevens te beschermen tegen onbevoegde toegang, verlies of
            vernietiging. Concreet omvat dit onder meer:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-outside ml-5">
            <li>Versleuteling van gegevenstransport via TLS/HTTPS;</li>
            <li>
              Opslag van wachtwoorden als versleutelde hashes (bcrypt) — nooit in
              leesbare vorm;
            </li>
            <li>Toegang tot productiegegevens beperkt tot geautoriseerd personeel;</li>
            <li>Regelmatige back-ups van de database;</li>
            <li>Monitoring op verdachte activiteiten en onbevoegde toegangspogingen.</li>
          </ul>
          <p className="mt-3">
            Bij een datalek dat een risico vormt voor uw rechten en vrijheden, zullen wij
            u en de Autoriteit Persoonsgegevens (AP) informeren conform de wettelijke
            termijnen.
          </p>
        </Section>

        {/* Artikel 8 */}
        <Section id="internationale-doorgifte" title="Artikel 8 — Internationale doorgifte">
          <p>
            Wij streven ernaar uw gegevens binnen de Europese Economische Ruimte (EER)
            te verwerken. Voor zover gegevens worden doorgegeven buiten de EER (bijv. via
            Stripe in de VS), vindt dit uitsluitend plaats op basis van passende
            waarborgen, zoals de door de Europese Commissie goedgekeurde Standard
            Contractual Clauses (SCC&apos;s) en het EU-VS Data Privacy Framework.
          </p>
        </Section>

        {/* Artikel 9 */}
        <Section id="uw-rechten" title="Artikel 9 — Uw rechten onder de AVG">
          <p>
            Op grond van de AVG heeft u de volgende rechten met betrekking tot uw
            persoonsgegevens. U kunt deze rechten uitoefenen door een verzoek te sturen
            aan{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Wij reageren binnen 30 dagen.
          </p>
          <div className="mt-4 space-y-3">
            <RightRow
              title="Recht op inzage (art. 15 AVG)"
              description="U heeft het recht te weten welke persoonsgegevens wij over u bewaren en hoe wij deze verwerken."
            />
            <RightRow
              title="Recht op rectificatie (art. 16 AVG)"
              description="U heeft het recht onjuiste of onvolledige persoonsgegevens te laten corrigeren."
            />
            <RightRow
              title="Recht op gegevenswissing / 'recht op vergetelheid' (art. 17 AVG)"
              description="U heeft het recht te verzoeken om verwijdering van uw persoonsgegevens. Wij voldoen aan dit verzoek tenzij een wettelijke bewaarplicht van toepassing is (bijv. fiscale administratie)."
            />
            <RightRow
              title="Recht op beperking van de verwerking (art. 18 AVG)"
              description="U kunt ons verzoeken de verwerking van uw gegevens tijdelijk te beperken, bijvoorbeeld gedurende een geschilprocedure."
            />
            <RightRow
              title="Recht op dataportabiliteit (art. 20 AVG)"
              description="U heeft het recht uw gegevens in een gestructureerd, machineleesbaar formaat te ontvangen, zodat u ze kunt overdragen aan een andere dienstverlener."
            />
            <RightRow
              title="Recht van bezwaar (art. 21 AVG)"
              description="U kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang, waaronder het gebruik van uw gegevens voor directe marketingdoeleinden."
            />
            <RightRow
              title="Recht om toestemming in te trekken"
              description="Indien de verwerking is gebaseerd op uw toestemming (bijv. nieuwsbrief), kunt u deze toestemming te allen tijde intrekken zonder dat dit gevolgen heeft voor de rechtmatigheid van de verwerking vóór de intrekking."
            />
          </div>
          <p className="mt-4">
            Bent u van mening dat wij uw persoonsgegevens niet conform de AVG verwerken?
            Dan heeft u het recht een klacht in te dienen bij de{' '}
            <a
              href="https://www.autoriteitpersoonsgegevens.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Autoriteit Persoonsgegevens
            </a>
            .
          </p>
        </Section>

        {/* Artikel 10 */}
        <Section id="wijzigingen" title="Artikel 10 — Wijzigingen in dit privacybeleid">
          <p>
            DirectBnB behoudt zich het recht voor dit privacybeleid te allen tijde te
            wijzigen. Bij wezenlijke wijzigingen stellen wij u hiervan op de hoogte via
            e-mail of een prominente melding op het Platform. De datum van de meest
            recente versie staat bovenaan dit document vermeld.
          </p>
          <p className="mt-3">
            Wij raden u aan dit privacybeleid periodiek te raadplegen.
          </p>
        </Section>

        {/* Artikel 11 */}
        <Section id="contact" title="Artikel 11 — Contact en Functionaris voor Gegevensbescherming">
          <p>
            Voor vragen, opmerkingen of het uitoefenen van uw rechten kunt u contact
            opnemen via:
          </p>
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm space-y-1">
            <p className="font-semibold text-slate-900">{COMPANY}</p>
            <p>
              E-mail:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>KvK-nummer: {KVK}</p>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Wij streven ernaar alle privacyverzoeken binnen <strong>30 dagen</strong> af
            te handelen. In geval van complexe of meervoudige verzoeken kan deze termijn
            met maximaal 60 dagen worden verlengd; u wordt hiervan tijdig op de hoogte
            gesteld.
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

function TableRow({ doel, grondslag }: { doel: string; grondslag: string }) {
  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-4 py-3 border border-slate-200 text-slate-700">{doel}</td>
      <td className="px-4 py-3 border border-slate-200 text-slate-600">{grondslag}</td>
    </tr>
  );
}

function ThirdPartyRow({
  name,
  role,
  location,
  basis,
}: {
  name: string;
  role: string;
  location: string;
  basis: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 grid grid-cols-[140px_1fr] gap-3 text-sm">
      <div>
        <p className="font-semibold text-slate-900">{name}</p>
        <p className="text-slate-400 text-xs mt-0.5">{location}</p>
      </div>
      <div>
        <p className="text-slate-700">{role}</p>
        <p className="text-slate-400 text-xs mt-0.5">{basis}</p>
      </div>
    </div>
  );
}

function RightRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <p className="font-semibold text-slate-900 text-sm">{title}</p>
      <p className="text-slate-600 text-sm mt-1 leading-relaxed">{description}</p>
    </div>
  );
}
