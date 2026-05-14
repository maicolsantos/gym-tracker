import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Política de Privacidade — Tracker Ginásio",
  description: "Como recolhemos, utilizamos e protegemos os seus dados pessoais.",
}

const LAST_UPDATED = "14 de maio de 2026"
const CONTACT_EMAIL = "maicolcostaa8@gmail.com"

export default function PrivacidadePage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Política de Privacidade</h1>
            <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Responsável pelo Tratamento</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O responsável pelo tratamento dos seus dados pessoais é Maicol Santos
            ({CONTACT_EMAIL}). Para qualquer questão relacionada com privacidade ou
            exercício dos seus direitos, contacte através do e-mail indicado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Dados Recolhidos</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div>
              <p className="font-medium text-foreground mb-1">Dados de identidade (via Google)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nome de exibição</li>
                <li>Fotografia de perfil</li>
                <li>Identificador único Google (UID)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Dados de utilização da aplicação</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Datas de treino registadas</li>
                <li>Pontos de experiência (XP) e histórico de transações</li>
                <li>Lista de amigos (UIDs mutuamente confirmados)</li>
                <li>Eventos de humilhação enviados e recebidos (com timestamps)</li>
                <li>Classificações mensais de ranking</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                Dados técnicos e de preferência (armazenados localmente)
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Preferência de tema (claro/escuro/sistema) — localStorage</li>
                <li>Estado do consentimento de cookies — localStorage</li>
                <li>Cache offline da aplicação — IndexedDB (Firestore)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Finalidade e Base Legal</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Finalidade</th>
                  <th className="text-left py-2 pr-4 font-medium">Base Legal (LGPD Art. 7)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground divide-y">
                <tr>
                  <td className="py-2 pr-4">Autenticação e identificação do utilizador</td>
                  <td className="py-2">Execução de contrato (Art. 7, II)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Registo e consulta de treinos</td>
                  <td className="py-2">Execução de contrato (Art. 7, II)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Sistema de amigos e ranking</td>
                  <td className="py-2">Consentimento do titular (Art. 7, I)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Gamificação (XP, humilhações)</td>
                  <td className="py-2">Consentimento do titular (Art. 7, I)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Análise de uso e desempenho</td>
                  <td className="py-2">Consentimento do titular (Art. 7, I) — opcional</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Serviços de Terceiros</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta aplicação utiliza os seguintes serviços externos que podem processar os seus dados:
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-foreground">Google Firebase (Autenticação e Base de Dados)</p>
              <p>Processa dados de identidade, treinos, amigos e XP. Dados armazenados em servidores Google Cloud (EUA). O Google atua como suboperador sob contrato de proteção de dados.</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-foreground">Vercel Analytics</p>
              <p>Recolhe métricas anónimas de utilização (visualizações de página, dispositivo). Apenas ativo com consentimento explícito.</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-foreground">Google Firebase Analytics</p>
              <p>Recolhe dados de sessão e eventos de interação. Apenas ativo com consentimento explícito.</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-foreground">Google Fonts (tipografia Geist)</p>
              <p>Ao carregar a página, o seu endereço IP e informações do browser são enviados aos servidores Google para obter os tipos de letra. Não está sujeito a consentimento pois é necessário para o funcionamento visual da aplicação.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Retenção de Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados são conservados enquanto a conta estiver ativa. Após eliminação da conta,
            os dados são apagados dos servidores Firebase no prazo de 30 dias. Dados de
            analytics anónimos podem ser retidos por até 14 meses conforme política do fornecedor.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Eventos de humilhação recebidos podem ser eliminados pelo destinatário a qualquer
            momento, exercendo o direito de apagamento previsto no Art. 17 da LGPD. Para tal,
            contacte {CONTACT_EMAIL}.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Os Seus Direitos (LGPD Art. 18)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enquanto titular dos dados, tem os seguintes direitos:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2 leading-relaxed">
            <li><span className="text-foreground font-medium">Acesso</span> — consultar quais dados pessoais estão armazenados</li>
            <li><span className="text-foreground font-medium">Correção</span> — atualizar dados incorretos ou incompletos</li>
            <li><span className="text-foreground font-medium">Eliminação</span> — solicitar a remoção dos seus dados pessoais</li>
            <li><span className="text-foreground font-medium">Portabilidade</span> — receber os seus dados num formato estruturado</li>
            <li><span className="text-foreground font-medium">Revogação do consentimento</span> — retirar o consentimento para analytics a qualquer momento</li>
            <li><span className="text-foreground font-medium">Informação sobre partilha</span> — saber com quem os dados foram partilhados</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para exercer qualquer destes direitos, contacte:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Segurança</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os dados são transmitidos via HTTPS e armazenados com controlos de acesso ao nível
            da base de dados (Firestore Security Rules). Apenas o próprio utilizador tem acesso
            de leitura/escrita aos seus dados. Amigos apenas visualizam nome, foto e contagem de
            treinos — nunca o histórico completo ou XP.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Cookies e Armazenamento Local</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Chave</th>
                  <th className="text-left py-2 pr-4 font-medium">Tipo</th>
                  <th className="text-left py-2 font-medium">Finalidade</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">theme</td>
                  <td className="py-2 pr-4">localStorage</td>
                  <td className="py-2">Preferência de tema visual</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">cookie-consent</td>
                  <td className="py-2 pr-4">localStorage</td>
                  <td className="py-2">Registo do consentimento de analytics</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">pwa-install-dismissed</td>
                  <td className="py-2 pr-4">localStorage</td>
                  <td className="py-2">Estado da notificação de instalação PWA</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">firestore/[uid]</td>
                  <td className="py-2 pr-4">IndexedDB</td>
                  <td className="py-2">Cache offline de dados da aplicação</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Alterações a Esta Política</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Qualquer alteração material a esta política será comunicada através da aplicação.
            A data de última atualização no topo desta página reflete sempre a versão vigente.
          </p>
        </section>

        <footer className="pt-4 border-t text-xs text-muted-foreground">
          Tracker de Ginásio — em conformidade com a Lei Geral de Proteção de Dados Pessoais
          (LGPD, Lei nº 13.709/2018).
        </footer>
      </div>
    </main>
  )
}
