export interface RuleDefinition {
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    status: RuleStatus;
    createdAt: string;
    updatedAt: string;
    version: number;
    content: RuleContent;
    parameters?: Record<string, any>;
}

export enum RuleStatus {
    Draft = 0,
    Active = 1,
    Archived = 2,
}

export interface RuleContent {
    predicateExpression: string;
    resultExpression: string;
    language: string;
    metadata: Record<string, any>;
}

export interface CreateRuleRequest {
    name: string;
    description?: string;
    tags?: string[];
    parameters?: Record<string, any>;
    content: RuleContent;
}

export interface UpdateRuleRequest {
    name?: string;
    description?: string;
    tags?: string[];
    status?: RuleStatus;
    parameters?: Record<string, any>;
    content?: RuleContent;
}

export interface RuleVersionSnapshot {
    id: number;
    ruleId: string;
    version: number;
    content: RuleContent;
    createdAt: string;
    createdBy?: string;
}

export interface RuleValidationRequest {
    ruleId: string;
    input: any;
}

export interface ValidationResult {
    isValid: boolean;
    errorMessages: string[];
}

export interface RuleExecutionResult {
    success: boolean;
    message?: string;
    result?: any;
    auditLog?: any;
}

export interface RuleExecutionAudit {
    id: string;
    ruleId: string;
    ruleVersion: number;
    input: string;
    output: string;
    success: boolean;
    errorMessage?: string;
    executionDurationMs: number;
    executedAt: string;
}

export const api = {
    async getAuditHistory(ruleId: string, limit: number = 50): Promise<RuleExecutionAudit[]> {
        const res = await fetch(`/api/Rule/audit/${ruleId}?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch audit history');
        return res.json();
    },

    async getRuleCode(ruleId: string): Promise<{ Predicate: string; Result: string }> {
        const res = await fetch(`/api/Rule/${ruleId}/code`);
        if (!res.ok) throw new Error('Failed to fetch rule code');
        return res.json();
    },

    async getAllRules(): Promise<RuleDefinition[]> {
        const res = await fetch('/api/Rule');
        if (!res.ok) throw new Error('Failed to fetch rules');
        return res.json();
    },

    async getRule(id: string): Promise<RuleDefinition> {
        const res = await fetch(`/api/Rule/${id}`);
        if (!res.ok) throw new Error('Failed to fetch rule');
        return res.json();
    },

    async createRule(request: CreateRuleRequest): Promise<RuleDefinition> {
        const res = await fetch('/api/Rule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Failed to create rule');
        return res.json();
    },

    async updateRule(id: string, request: UpdateRuleRequest): Promise<RuleDefinition> {
        const res = await fetch(`/api/Rule/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Failed to update rule');
        return res.json();
    },

    async deleteRule(id: string): Promise<void> {
        const res = await fetch(`/api/Rule/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete rule');
    },

    async evaluateRule(id: string, input: any): Promise<RuleExecutionResult> {
        const res = await fetch(`/api/Rule/evaluate/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error('Failed to evaluate rule');
        return res.json();
    },

    async getVersions(ruleId: string): Promise<RuleVersionSnapshot[]> {
        const res = await fetch(`/api/Rule/versions/${ruleId}`);
        if (!res.ok) throw new Error('Failed to fetch versions');
        return res.json();
    },

    async createVersion(ruleId: string, request: { content: RuleContent; parameters?: any; activate?: boolean }): Promise<RuleDefinition> {
        const res = await fetch(`/api/Rule/${ruleId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Failed to create version');
        return res.json();
    }
};

// Campaign API

export interface GeneralCampaign {
    id: number;
    code: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    priority: number;
    predicate: string;
    result: string;
    usage: string;
    campaignTypes: number;
    createDate: string;
    modulId: number;
    promotionCode?: string;
    quota?: number;
}

export interface CampaignRuleInput {
    totalAmount: number;
    customerType: string;
    orderCount: number;
    productCount: number;
    orderTime: string; // ISO DateTime
    city: string;
    category: string;
    usageCount: number;
}

export interface CampaignOutput {
    totalDiscount: string; // Serialized Price struct e.g., "100 TRY"
    campaignProductDiscount?: {
        productKey: string;
        discountAmount: string;
        discountPercentage: number;
        discountType: string;
    };
}

export const campaignApi = {
    async getAllCampaigns(moduleId: number = 1): Promise<GeneralCampaign[]> {
        const res = await fetch(`/api/Campaign?moduleId=${moduleId}`);
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        return res.json();
    },

    async evaluateCampaigns(input: CampaignRuleInput): Promise<CampaignOutput[]> {
        const res = await fetch('/api/Campaign/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });
        if (!res.ok) throw new Error('Failed to evaluate campaigns');
        return res.json();
    },

    async createCampaign(campaign: Partial<GeneralCampaign>): Promise<GeneralCampaign> {
        const res = await fetch('/api/Campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaign)
        });
        if (!res.ok) throw new Error('Failed to create campaign');
        return res.json();
    },

    async updateCampaign(id: number, campaign: GeneralCampaign): Promise<void> {
        const res = await fetch(`/api/Campaign/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaign)
        });
        if (!res.ok) throw new Error('Failed to update campaign');
    },

    async deleteCampaign(id: number): Promise<void> {
        const res = await fetch(`/api/Campaign/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete campaign');
    }
};
