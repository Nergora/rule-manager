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
    type: RuleType;
    condition?: Condition;
    action?: RuleAction;
    rules?: RuleContent[];
}

export enum RuleType {
    Condition = 0,
    RuleSet = 1,
}

export interface Condition {
    operator: string;
    property?: string;
    value?: any;
    conditions?: Condition[];
}

export interface RuleAction {
    type: string;
    parameters?: Record<string, any>;
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
};
