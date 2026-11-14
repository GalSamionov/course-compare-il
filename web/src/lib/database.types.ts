
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
            "admins": {
                  Row: {
                    "added_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"user_id": string
                  }
                  Update: {
                    "added_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": NonNullable<Json>,"id": number,"review_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: never,"review_id": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: never,"review_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
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
                },"compare_items": {
                  Row: {
                    "course_id": string,"created_at": string,"position": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"position": number,"user_id": string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"position"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "compare_items_user_id_course_id_fkey"
      columns: ["user_id","course_id"]
isOneToOne: true
      referencedRelation: "saved_courses"
      referencedColumns: ["user_id","course_id"]
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
                    "admission": string | null,"category_id": string,"certificate": string | null,"check_tier": Database["public"]['Enums']["check_tier"],"class_size_note": string | null,"created_at": string,"duration_months": number | null,"formats": (string)[],"hands_on_hours": number | null,"id": string,"institution_id": string,"institution_promises": string | null,"last_checked_at": string | null,"lecture_hours": number | null,"lecturers_note": string | null,"lecturers_summary": string | null,"next_cohort_date": string | null,"page_url": string | null,"product_type": string,"region": string | null,"schedule": string | null,"site_price_ils": number | null,"slug": string,"status": Database["public"]['Enums']["course_status"],"summary_good": string | null,"summary_weak": string | null,"syllabus": NonNullable<Json>,"time_slots": (string)[],"title": string,"total_hours": number | null,"updated_at": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admission"?: string | null,"category_id": string,"certificate"?: string | null,"check_tier"?: Database["public"]['Enums']["check_tier"],"class_size_note"?: string | null,"created_at"?: string,"duration_months"?: number | null,"formats"?: (string)[],"hands_on_hours"?: number | null,"id"?: string,"institution_id": string,"institution_promises"?: string | null,"last_checked_at"?: string | null,"lecture_hours"?: number | null,"lecturers_note"?: string | null,"lecturers_summary"?: string | null,"next_cohort_date"?: string | null,"page_url"?: string | null,"product_type"?: string,"region"?: string | null,"schedule"?: string | null,"site_price_ils"?: number | null,"slug": string,"status"?: Database["public"]['Enums']["course_status"],"summary_good"?: string | null,"summary_weak"?: string | null,"syllabus"?: NonNullable<Json>,"time_slots"?: (string)[],"title": string,"total_hours"?: number | null,"updated_at"?: string,"video_url"?: string | null
                  }
                  Update: {
                    "admission"?: string | null,"category_id"?: string,"certificate"?: string | null,"check_tier"?: Database["public"]['Enums']["check_tier"],"class_size_note"?: string | null,"created_at"?: string,"duration_months"?: number | null,"formats"?: (string)[],"hands_on_hours"?: number | null,"id"?: string,"institution_id"?: string,"institution_promises"?: string | null,"last_checked_at"?: string | null,"lecture_hours"?: number | null,"lecturers_note"?: string | null,"lecturers_summary"?: string | null,"next_cohort_date"?: string | null,"page_url"?: string | null,"product_type"?: string,"region"?: string | null,"schedule"?: string | null,"site_price_ils"?: number | null,"slug"?: string,"status"?: Database["public"]['Enums']["course_status"],"summary_good"?: string | null,"summary_weak"?: string | null,"syllabus"?: NonNullable<Json>,"time_slots"?: (string)[],"title"?: string,"total_hours"?: number | null,"updated_at"?: string,"video_url"?: string | null
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
                },"proofs": {
                  Row: {
                    "author_id": string | null,"check_result": Json | null,"check_status": string,"claimed_kind": Database["public"]['Enums']["proof_kind"],"created_at": string,"decided_at": string | null,"file_deleted_at": string | null,"flags": (string)[],"id": string,"mime_type": string,"review_id": string | null,"sha256": string,"size_bytes": number,"status": Database["public"]['Enums']["proof_status"],"storage_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"check_result"?: Json | null,"check_status": string,"claimed_kind": Database["public"]['Enums']["proof_kind"],"created_at"?: string,"decided_at"?: string | null,"file_deleted_at"?: string | null,"flags"?: (string)[],"id"?: string,"mime_type": string,"review_id"?: string | null,"sha256": string,"size_bytes": number,"status"?: Database["public"]['Enums']["proof_status"],"storage_path"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"check_result"?: Json | null,"check_status"?: string,"claimed_kind"?: Database["public"]['Enums']["proof_kind"],"created_at"?: string,"decided_at"?: string | null,"file_deleted_at"?: string | null,"flags"?: (string)[],"id"?: string,"mime_type"?: string,"review_id"?: string | null,"sha256"?: string,"size_bytes"?: number,"status"?: Database["public"]['Enums']["proof_status"],"storage_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "proofs_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
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
                },"review_helpful": {
                  Row: {
                    "browser_hash": string,"created_at": string,"review_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "browser_hash": string,"created_at"?: string,"review_id": string
                  }
                  Update: {
                    "browser_hash"?: string,"created_at"?: string,"review_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_helpful_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "author_id": string | null,"author_title": Database["public"]['Enums']["author_title"],"body": string,"cohort_month": string,"course_id": string,"created_at": string,"decision_note": string | null,"display_mode": Database["public"]['Enums']["display_name_mode"],"display_name": string,"disputed_at": string | null,"excluded_reason": string | null,"finished_month": string | null,"follow_up_text": string | null,"helpful_count": number,"id": string,"paid_bucket_ils": number | null,"proof_kind": Database["public"]['Enums']["proof_kind"] | null,"published_at": string | null,"read_count": number,"status": Database["public"]['Enums']["review_status"],"submitted_at": string | null,"updated_at": string,"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"author_title"?: Database["public"]['Enums']["author_title"],"body"?: string,"cohort_month": string,"course_id": string,"created_at"?: string,"decision_note"?: string | null,"display_mode"?: Database["public"]['Enums']["display_name_mode"],"display_name"?: string,"disputed_at"?: string | null,"excluded_reason"?: string | null,"finished_month"?: string | null,"follow_up_text"?: string | null,"helpful_count"?: number,"id"?: string,"paid_bucket_ils"?: number | null,"proof_kind"?: Database["public"]['Enums']["proof_kind"] | null,"published_at"?: string | null,"read_count"?: number,"status"?: Database["public"]['Enums']["review_status"],"submitted_at"?: string | null,"updated_at"?: string,"verified_at"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"author_title"?: Database["public"]['Enums']["author_title"],"body"?: string,"cohort_month"?: string,"course_id"?: string,"created_at"?: string,"decision_note"?: string | null,"display_mode"?: Database["public"]['Enums']["display_name_mode"],"display_name"?: string,"disputed_at"?: string | null,"excluded_reason"?: string | null,"finished_month"?: string | null,"follow_up_text"?: string | null,"helpful_count"?: number,"id"?: string,"paid_bucket_ils"?: number | null,"proof_kind"?: Database["public"]['Enums']["proof_kind"] | null,"published_at"?: string | null,"read_count"?: number,"status"?: Database["public"]['Enums']["review_status"],"submitted_at"?: string | null,"updated_at"?: string,"verified_at"?: string | null
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
                },"saved_courses": {
                  Row: {
                    "course_id": string,"created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"user_id": string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_courses_course_id_fkey"
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
                },"user_answers": {
                  Row: {
                    "answers": NonNullable<Json>,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers": NonNullable<Json>,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"vendor_responses": {
                  Row: {
                    "body": string,"id": string,"posted_at": string,"review_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"id"?: string,"posted_at"?: string,"review_id": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"id"?: string,"posted_at"?: string,"review_id"?: string,"updated_at"?: string
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
            "count_review_read":
{ Args: { "p_review_id": string }; Returns: undefined
                           },
"course_paid_range":
{ Args: { "p_course_id": string }; Returns: {
              "invoice_count": number,"max_ils": number,"min_ils": number
            }[]
                           },
"delete_review":
{ Args: { "p_action": string,"p_actor_id"?: string,"p_review_id": string }; Returns: {
              "course_slug": string,"was_published": boolean
            }[]
                           },
"forget_auth_log":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"my_reviews":
{ Args: Record<PropertyKey, never>; Returns: {
              "answers": Json,"author_title": Database["public"]['Enums']["author_title"],"body": string,"cohort_month": string,"course_id": string,"decision_note": string,"display_mode": Database["public"]['Enums']["display_name_mode"],"display_name": string,"finished_month": string,"helpful_count": number,"id": string,"published_at": string,"read_count": number,"status": Database["public"]['Enums']["review_status"],"submitted_at": string,"updated_at": string
            }[]
                           },
"proof_orphans":
{ Args: { "p_age_hours": number }; Returns: string[]
                           },
"publish_review":
{ Args: { "p_admin_id": string,"p_paid_bucket"?: number,"p_proof_kind": Database["public"]['Enums']["proof_kind"],"p_review_id": string }; Returns: string
                           },
"return_review":
{ Args: { "p_action": string,"p_admin_id": string,"p_note": string,"p_reason": string,"p_review_id": string }; Returns: undefined
                           },
"submit_review":
{ Args: { "p_author_id": string,"p_proofs": Json,"p_review_id": string }; Returns: undefined
                           },
"toggle_helpful":
{ Args: { "p_browser_id": string,"p_review_id": string }; Returns: {
              "is_helpful": boolean,"total": number
            }[]
                           }
          }
          Enums: {
            "author_title": "graduate_m"|"graduate_f"|"none","check_tier": "full"|"partial"|"listed","course_status": "draft"|"active"|"maybe_inactive"|"removed","course_type": "career"|"hobby"|"exam","display_name_mode": "full"|"first_initial"|"anonymous","metric_scale": "likert5"|"yes_no","proof_kind": "invoice"|"graduate_list"|"certificate"|"enrollment_email"|"employer_letter"|"screenshot"|"project","proof_status": "pending"|"approved"|"rejected"|"more_requested","review_status": "draft"|"pending"|"published"|"disputed"|"removed","score_kind": "graduate"|"full"
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
            "author_title": ["graduate_m", "graduate_f", "none"],"check_tier": ["full", "partial", "listed"],"course_status": ["draft", "active", "maybe_inactive", "removed"],"course_type": ["career", "hobby", "exam"],"display_name_mode": ["full", "first_initial", "anonymous"],"metric_scale": ["likert5", "yes_no"],"proof_kind": ["invoice", "graduate_list", "certificate", "enrollment_email", "employer_letter", "screenshot", "project"],"proof_status": ["pending", "approved", "rejected", "more_requested"],"review_status": ["draft", "pending", "published", "disputed", "removed"],"score_kind": ["graduate", "full"]
          }
        }
} as const
