export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nome: string
          usuario_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          usuario_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          usuario_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      despesas_recorrentes: {
        Row: {
          id: string
          usuario_id: string
          valor: number
          descricao: string
          dia_vencimento: number
          categoria_id: string | null
          ativa: boolean
          data_inicio: string
          data_fim: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          valor: number
          descricao: string
          dia_vencimento: number
          categoria_id?: string | null
          ativa?: boolean
          data_inicio?: string
          data_fim?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          valor?: number
          descricao?: string
          dia_vencimento?: number
          categoria_id?: string | null
          ativa?: boolean
          data_inicio?: string
          data_fim?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "despesas_recorrentes_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_recorrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      configuracoes_orcamento: {
        Row: {
          id: string
          usuario_id: string
          valor_mensal: number
          valor_reserva_emergencia: number
          percentual_lazer: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          valor_mensal: number
          valor_reserva_emergencia?: number
          percentual_lazer?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          valor_mensal?: number
          valor_reserva_emergencia?: number
          percentual_lazer?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_orcamento_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      transacoes: {
        Row: {
          id: string
          usuario_id: string
          valor: number
          tipo: 'entrada' | 'saida'
          data: string
          descricao: string
          categoria_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          valor: number
          tipo: 'entrada' | 'saida'
          data: string
          descricao: string
          categoria_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          valor?: number
          tipo?: 'entrada' | 'saida'
          data?: string
          descricao?: string
          categoria_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}