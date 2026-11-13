
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categories": {
                  Row: {
                    "course_type": Database["public"]['Enums']["course_type"],"created_at": string,"id": string,"name": string,"parent_id": string | null,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_type": Database["public"]['Enums']["course_type"],"created_at"?: string,"id"?: string,"name": string,"parent_id"?: string | null,"slug": string
                  }
                  Update: {
                    "course_type"?: Database["public"]['Enums']["course_type"],"created_at"?: string,"id"?: string,"name"?: string,"parent_id"?: string | null,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"course_lecturers": {
                  Row: {
                    "course_id": string,"lecturer_id": string,"role": string | null,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"lecturer_id": string,"role"?: string | null,"sort_order"?: number
                  }
                  Update: {
                    "course_id"?: string,"lecturer_id"?: string,"role"?: string | null,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_lecturers_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_lecturers_lecturer_id_fkey"
      columns: ["lecturer_id"]
isOneToOne: false
      referencedRelation: "lecturers"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "admission": string | null,"category_id": string,"certificate": string | null,"check_tier": Database["public"]['Enums']["check_tier"],"class_size_note": string | null,"created_at": string,"duration_months": number | null,"formats": (string)[],"hands_on_hours": number | null,"id": string,"institution_id": string,"institution_promises": string | null,"last_checked_at": string | null,"lecture_hours": number | null,"lecturers_note": string | null,"lecturers_summary": string | null,"next_cohort_date": string | null,"page_url": string | null,"region": string | null,"schedule": string | null,"site_price_ils": number | null,"slug": string,"status": Database["public"]['Enums']["course_status"],"summary_good": string | null,"summary_weak": string | null,"syllabus": NonNullable<Json>,"title": string,"total_hours": number | null,"updated_at": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admission"?: string | null,"category_id": string,"certificate"?: string | null,"check_tier"?: Database["public"]['Enums']["check_tier"],"class_size_note"?: string | null,"created_at"?: string,"duration_months"?: number | null,"formats"?: (string)[],"hands_on_hours"?: number | null,"id"?: string,"institution_id": string,"institution_promises"?: string | null,"last_checked_at"?: string | null,"lecture_hours"?: number | null,"lecturers_note"?: string | null,"lecturers_summary"?: string | null,"next_cohort_date"?: string | null,"page_url"?: string | null,"region"?: string | null,"schedule"?: string | null,"site_price_ils"?: number | null,"slug": string,"status"?: Database["public"]['Enums']["course_status"],"summary_good"?: string | null,"summary_weak"?: string | null,"syllabus"?: NonNullable<Json>,"title": string,"total_hours"?: number | null,"updated_at"?: string,"video_url"?: string | null
                  }
                  Update: {
                    "admission"?: string | null,"category_id"?: string,"certificate"?: string | null,"check_tier"?: Database["public"]['Enums']["check_tier"],"class_size_note"?: string | null,"created_at"?: string,"duration_months"?: number | null,"formats"?: (string)[],"hands_on_hours"?: number | null,"id"?: string,"institution_id"?: string,"institution_promises"?: string | null,"last_checked_at"?: string | null,"lecture_hours"?: number | null,"lecturers_note"?: string | null,"lecturers_summary"?: string | null,"next_cohort_date"?: string | null,"page_url"?: string | null,"region"?: string | null,"schedule"?: string | null,"site_price_ils"?: number | null,"slug"?: string,"status"?: Database["public"]['Enums']["course_status"],"summary_good"?: string | null,"summary_weak"?: string | null,"syllabus"?: NonNullable<Json>,"title"?: string,"total_hours"?: number | null,"updated_at"?: string,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "courses_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courses_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institutions"
      referencedColumns: ["id"]
    }
                  ]
                },"institutions": {
                  Row: {
                    "business_number": string | null,"created_at": string,"id": string,"kind": string,"name": string,"slug": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_number"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"name": string,"slug": string,"website"?: string | null
                  }
                  Update: {
                    "business_number"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"name"?: string,"slug"?: string,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"lecturers": {
                  Row: {
                    "created_at": string,"id": string,"institution_bio": string | null,"name": string,"slug": string,"verified_facts": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"institution_bio"?: string | null,"name": string,"slug": string,"verified_facts"?: NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"institution_bio"?: string | null,"name"?: string,"slug"?: string,"verified_facts"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"method_changes": {
                  Row: {
                    "changed_at": string,"id": number,"reason": string,"summary": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"id"?: never,"reason": string,"summary": string,"version": string
                  }
                  Update: {
                    "changed_at"?: string,"id"?: never,"reason"?: string,"summary"?: string,"version"?: string
                  }
                  Relationships: [
                    
                  ]
                },"metrics": {
                  Row: {
                    "course_types": (Database["public"]['Enums']["course_type"])[],"in_score": boolean,"key": string,"label": string,"scale": Database["public"]['Enums']["metric_scale"],"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "course_types": (Database["public"]['Enums']["course_type"])[],"in_score"?: boolean,"key": string,"label": string,"scale": Database["public"]['Enums']["metric_scale"],"sort_order": number
                  }
                  Update: {
                    "course_types"?: (Database["public"]['Enums']["course_type"])[],"in_score"?: boolean,"key"?: string,"label"?: string,"scale"?: Database["public"]['Enums']["metric_scale"],"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"review_answers": {
                  Row: {
                    "answered_at": string,"metric_key": string,"review_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answered_at"?: string,"metric_key": string,"review_id": string,"value": number
                  }
                  Update: {
                    "answered_at"?: string,"metric_key"?: string,"review_id"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_answers_metric_key_fkey"
      columns: ["metric_key"]
isOneToOne: false
      referencedRelation: "metrics"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "review_answers_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "author_id": string | null,"body": string,"cohort_month": string,"course_id": string,"created_at": string,"display_mode": Database["public"]['Enums']["display_name_mode"],"display_name": string,"excluded_reason": string | null,"follow_up_text": string | null,"id": string,"paid_bucket_ils": number | null,"proof_kind": Database["public"]['Enums']["proof_kind"] | null,"published_at": string | null,"status": Database["public"]['Enums']["review_status"],"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"cohort_month": string,"course_id": string,"created_at"?: string,"display_mode"?: Database["public"]['Enums']["display_name_mode"],"display_name": string,"excluded_reason"?: string | null,"follow_up_text"?: string | null,"id"?: string,"paid_bucket_ils"?: number | null,"proof_kind"?: Database["public"]['Enums']["proof_kind"] | null,"published_at"?: string | null,"status"?: Database["public"]['Enums']["review_status"],"verified_at"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"cohort_month"?: string,"course_id"?: string,"created_at"?: string,"display_mode"?: Database["public"]['Enums']["display_name_mode"],"display_name"?: string,"excluded_reason"?: string | null,"follow_up_text"?: string | null,"id"?: string,"paid_bucket_ils"?: number | null,"proof_kind"?: Database["public"]['Enums']["proof_kind"] | null,"published_at"?: string | null,"status"?: Database["public"]['Enums']["review_status"],"verified_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"scores": {
                  Row: {
                    "computed_at": string,"course_id": string,"expires_at": string | null,"explanation": NonNullable<Json>,"id": number,"kind": Database["public"]['Enums']["score_kind"],"method_version": string,"per_metric": NonNullable<Json>,"recommend_pct": number | null,"review_count": number,"reviews_needed": number | null,"stale": boolean,"status": string,"value": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "computed_at"?: string,"course_id": string,"expires_at"?: string | null,"explanation"?: NonNullable<Json>,"id"?: never,"kind": Database["public"]['Enums']["score_kind"],"method_version": string,"per_metric"?: NonNullable<Json>,"recommend_pct"?: number | null,"review_count": number,"reviews_needed"?: number | null,"stale"?: boolean,"status": string,"value"?: number | null
                  }
                  Update: {
                    "computed_at"?: string,"course_id"?: string,"expires_at"?: string | null,"explanation"?: NonNullable<Json>,"id"?: never,"kind"?: Database["public"]['Enums']["score_kind"],"method_version"?: string,"per_metric"?: NonNullable<Json>,"recommend_pct"?: number | null,"review_count"?: number,"reviews_needed"?: number | null,"stale"?: boolean,"status"?: string,"value"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "scores_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "scores_method_version_fkey"
      columns: ["method_version"]
isOneToOne: false
      referencedRelation: "method_changes"
      referencedColumns: ["version"]
    }
                  ]
                },"vendor_responses": {
                  Row: {
                    "body": string,"id": string,"posted_at": string,"review_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"id"?: string,"posted_at"?: string,"review_id": string
                  }
                  Update: {
                    "body"?: string,"id"?: string,"posted_at"?: string,"review_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_responses_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "course_paid_range":
{ Args: { "p_course_id": string }; Returns: {
              "invoice_count": number,"max_ils": number,"min_ils": number
            }[]
                           }
          }
          Enums: {
            "check_tier": "full"|"partial"|"listed","course_status": "draft"|"active"|"maybe_inactive"|"removed","course_type": "career"|"hobby"|"exam","display_name_mode": "full"|"first_initial"|"anonymous","metric_scale": "likert5"|"yes_no","proof_kind": "invoice"|"graduate_list"|"certificate"|"enrollment_email"|"employer_letter"|"screenshot"|"project","review_status": "draft"|"pending"|"published"|"disputed"|"removed","score_kind": "graduate"|"full"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "check_tier": ["full", "partial", "listed"],"course_status": ["draft", "active", "maybe_inactive", "removed"],"course_type": ["career", "hobby", "exam"],"display_name_mode": ["full", "first_initial", "anonymous"],"metric_scale": ["likert5", "yes_no"],"proof_kind": ["invoice", "graduate_list", "certificate", "enrollment_email", "employer_letter", "screenshot", "project"],"review_status": ["draft", "pending", "published", "disputed", "removed"],"score_kind": ["graduate", "full"]
          }
        }
} as const
