// Interface principal do benefício
export interface Benefit {
  id: string;
  payslipId: string;
  code: string;
  type: string;
  description?: string | null;
  value: number;
  payslip?: {
    id: string;
    employeeName: string;
    employeeCode: string;
  };
}

// Interface para criação de benefício
export interface CreateBenefitRequest {
  payslipId: string;
  code: string;
  type: string;
  description?: string | null;
  value: number;
}

// Interface para atualização de benefício
export interface UpdateBenefitRequest {
  id: string;
  code?: string;
  type?: string;
  description?: string | null;
  value?: number;
}

// Interface para filtros da listagem de benefícios
export interface BenefitFilters {
  payslipId?: string;
  code?: string;
  type?: string;
  minValue?: number;
  maxValue?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para resposta de listagem de benefícios
export interface BenefitListResponse {
  success: boolean;
  benefits: Benefit[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Interface para resposta de um único benefício
export interface BenefitResponse {
  success: boolean;
  benefit: Benefit;
  message?: string;
}

// Tipos para as respostas da API
export interface BenefitApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  benefit?: Benefit;
}

// Interface para estatísticas de benefícios
export interface BenefitStats {
  totalBenefits: number;
  totalValue: number;
  averageValue: number;
  benefitsByType: Array<{
    type: string;
    count: number;
    totalValue: number;
  }>;
  benefitsByCode: Array<{
    code: string;
    count: number;
    totalValue: number;
  }>;
  mostUsedBenefits: Array<{
    code: string;
    type: string;
    count: number;
  }>;
}

// Enums e constantes para códigos de benefícios comuns
export enum CommonBenefitCodes {
  VT = 'VT',        // Vale Transporte
  VR = 'VR',        // Vale Refeição
  VA = 'VA',        // Vale Alimentação
  PLR = 'PLR',      // Participação nos Lucros e Resultados
  AD = 'AD',        // Adicional Noturno
  HE = 'HE',        // Horas Extras
  AS = 'AS',        // Auxílio Saúde
  SEG = 'SEG',      // Seguro de Vida
  BONUS = 'BONUS',  // Bônus
  COM = 'COM',      // Comissão
  AUX = 'AUX',      // Auxílio Geral
  PREM = 'PREM'     // Prêmio
}

// Descrições dos tipos de benefícios
export const BenefitTypeDescriptions: Record<string, string> = {
  [CommonBenefitCodes.VT]: 'Vale Transporte',
  [CommonBenefitCodes.VR]: 'Vale Refeição',
  [CommonBenefitCodes.VA]: 'Vale Alimentação',
  [CommonBenefitCodes.PLR]: 'Participação nos Lucros e Resultados',
  [CommonBenefitCodes.AD]: 'Adicional Noturno',
  [CommonBenefitCodes.HE]: 'Horas Extras',
  [CommonBenefitCodes.AS]: 'Auxílio Saúde',
  [CommonBenefitCodes.SEG]: 'Seguro de Vida',
  [CommonBenefitCodes.BONUS]: 'Bônus',
  [CommonBenefitCodes.COM]: 'Comissão',
  [CommonBenefitCodes.AUX]: 'Auxílio Geral',
  [CommonBenefitCodes.PREM]: 'Prêmio'
};