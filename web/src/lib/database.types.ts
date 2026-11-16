
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
                    "action": string,"actor_id": string | null,"company_request_id": number | null,"course_queue_id": number | null,"course_submission_id": number | null,"created_at": string,"details": NonNullable<Json>,"id": number,"institution_request_id": number | null,"review_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"company_request_id"?: number | null,"course_queue_id"?: number | null,"course_submission_id"?: number | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: never,"institution_request_id"?: number | null,"review_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"company_request_id"?: number | null,"course_queue_id"?: number | null,"course_submission_id"?: number | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: never,"institution_request_id"?: number | null,"review_id"?: string | null
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
                },"company_requests": {
                  Row: {
                    "client_hash": string | null,"closed_at": string | null,"company_name": string,"contact_name": string,"contacted_at": string | null,"created_at": string,"email": string,"format": string | null,"id": number,"needs": string,"phone": string | null,"status": string,"team_size": string | null,"timing": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_hash"?: string | null,"closed_at"?: string | null,"company_name": string,"contact_name": string,"contacted_at"?: string | null,"created_at"?: string,"email": string,"format"?: string | null,"id"?: never,"needs": string,"phone"?: string | null,"status"?: string,"team_size"?: string | null,"timing"?: string | null
                  }
                  Update: {
                    "client_hash"?: string | null,"closed_at"?: string | null,"company_name"?: string,"contact_name"?: string,"contacted_at"?: string | null,"created_at"?: string,"email"?: string,"format"?: string | null,"id"?: never,"needs"?: string,"phone"?: string | null,"status"?: string,"team_size"?: string | null,"timing"?: string | null
                  }
                  Relationships: [
                    
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
                },"course_change_queue": {
                  Row: {
                    "confidence": string | null,"course_id": string | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"field": string | null,"id": number,"kind": string,"new_value": Json | null,"old_value": Json | null,"page_id": number | null,"quote": string | null,"reasons": (string)[],"run_id": number | null,"snapshot_id": number | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confidence"?: string | null,"course_id"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"field"?: string | null,"id"?: never,"kind": string,"new_value"?: Json | null,"old_value"?: Json | null,"page_id"?: number | null,"quote"?: string | null,"reasons"?: (string)[],"run_id"?: number | null,"snapshot_id"?: number | null,"status"?: string
                  }
                  Update: {
                    "confidence"?: string | null,"course_id"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"field"?: string | null,"id"?: never,"kind"?: string,"new_value"?: Json | null,"old_value"?: Json | null,"page_id"?: number | null,"quote"?: string | null,"reasons"?: (string)[],"run_id"?: number | null,"snapshot_id"?: number | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_change_queue_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_change_queue_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "scrape_pages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_change_queue_run_id_fkey"
      columns: ["run_id"]
isOneToOne: false
      referencedRelation: "scrape_runs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_change_queue_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "course_snapshots"
      referencedColumns: ["id"]
    }
                  ]
                },"course_changes": {
                  Row: {
                    "approved_by": string | null,"course_id": string,"created_at": string,"field": string,"id": number,"new_value": Json | null,"old_value": Json | null,"queue_id": number | null,"quote": string | null,"reverts_id": number | null,"run_id": number | null,"snapshot_id": number | null,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_by"?: string | null,"course_id": string,"created_at"?: string,"field": string,"id"?: never,"new_value"?: Json | null,"old_value"?: Json | null,"queue_id"?: number | null,"quote"?: string | null,"reverts_id"?: number | null,"run_id"?: number | null,"snapshot_id"?: number | null,"source": string
                  }
                  Update: {
                    "approved_by"?: string | null,"course_id"?: string,"created_at"?: string,"field"?: string,"id"?: never,"new_value"?: Json | null,"old_value"?: Json | null,"queue_id"?: number | null,"quote"?: string | null,"reverts_id"?: number | null,"run_id"?: number | null,"snapshot_id"?: number | null,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_changes_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_changes_queue_id_fkey"
      columns: ["queue_id"]
isOneToOne: false
      referencedRelation: "course_change_queue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_changes_reverts_id_fkey"
      columns: ["reverts_id"]
isOneToOne: false
      referencedRelation: "course_changes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_changes_run_id_fkey"
      columns: ["run_id"]
isOneToOne: false
      referencedRelation: "scrape_runs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_changes_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "course_snapshots"
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
                },"course_snapshots": {
                  Row: {
                    "content_hash": string,"course_id": string | null,"created_at": string,"extracted": NonNullable<Json>,"fetch_method": string,"fetched_at": string,"id": number,"model": string | null,"page_id": number,"page_text": string,"run_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "content_hash": string,"course_id"?: string | null,"created_at"?: string,"extracted"?: NonNullable<Json>,"fetch_method": string,"fetched_at": string,"id"?: never,"model"?: string | null,"page_id": number,"page_text": string,"run_id": number
                  }
                  Update: {
                    "content_hash"?: string,"course_id"?: string | null,"created_at"?: string,"extracted"?: NonNullable<Json>,"fetch_method"?: string,"fetched_at"?: string,"id"?: never,"model"?: string | null,"page_id"?: number,"page_text"?: string,"run_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_snapshots_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_snapshots_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "scrape_pages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_snapshots_run_id_fkey"
      columns: ["run_id"]
isOneToOne: false
      referencedRelation: "scrape_runs"
      referencedColumns: ["id"]
    }
                  ]
                },"course_submissions": {
                  Row: {
                    "category_id": string | null,"client_hash": string | null,"course_id": string | null,"course_title": string | null,"course_type": Database["public"]['Enums']["course_type"] | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"decision_reason": string | null,"draft_course_id": string | null,"id": number,"institution_name": string | null,"merged_into": string | null,"note": string | null,"page_id": number | null,"source": string,"status": string,"submitted_by": string | null,"url": string,"url_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"client_hash"?: string | null,"course_id"?: string | null,"course_title"?: string | null,"course_type"?: Database["public"]['Enums']["course_type"] | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_reason"?: string | null,"draft_course_id"?: string | null,"id"?: never,"institution_name"?: string | null,"merged_into"?: string | null,"note"?: string | null,"page_id"?: number | null,"source": string,"status"?: string,"submitted_by"?: string | null,"url": string,"url_key": string
                  }
                  Update: {
                    "category_id"?: string | null,"client_hash"?: string | null,"course_id"?: string | null,"course_title"?: string | null,"course_type"?: Database["public"]['Enums']["course_type"] | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_reason"?: string | null,"draft_course_id"?: string | null,"id"?: never,"institution_name"?: string | null,"merged_into"?: string | null,"note"?: string | null,"page_id"?: number | null,"source"?: string,"status"?: string,"submitted_by"?: string | null,"url"?: string,"url_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_submissions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_submissions_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_submissions_merged_into_fkey"
      columns: ["merged_into"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_submissions_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "scrape_pages"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "admission": string | null,"category_id": string | null,"certificate": string | null,"check_tier": Database["public"]['Enums']["check_tier"],"class_size_note": string | null,"created_at": string,"duration_months": number | null,"formats": (string)[],"hands_on_hours": number | null,"id": string,"institution_id": string,"institution_promises": string | null,"last_checked_at": string | null,"lecture_hours": number | null,"lecturers_note": string | null,"lecturers_summary": string | null,"next_cohort_date": string | null,"page_url": string | null,"product_type": string,"region": string | null,"schedule": string | null,"site_price_ils": number | null,"slug": string,"status": Database["public"]['Enums']["course_status"],"summary_good": string | null,"summary_weak": string | null,"syllabus": NonNullable<Json>,"time_slots": (string)[],"title": string,"total_hours": number | null,"updated_at": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admission"?: string | null,"category_id"?: string | null,"certificate"?: string | null,"check_tier"?: Database["public"]['Enums']["check_tier"],"class_size_note"?: string | null,"created_at"?: string,"duration_months"?: number | null,"formats"?: (string)[],"hands_on_hours"?: number | null,"id"?: string,"institution_id": string,"institution_promises"?: string | null,"last_checked_at"?: string | null,"lecture_hours"?: number | null,"lecturers_note"?: string | null,"lecturers_summary"?: string | null,"next_cohort_date"?: string | null,"page_url"?: string | null,"product_type"?: string,"region"?: string | null,"schedule"?: string | null,"site_price_ils"?: number | null,"slug": string,"status"?: Database["public"]['Enums']["course_status"],"summary_good"?: string | null,"summary_weak"?: string | null,"syllabus"?: NonNullable<Json>,"time_slots"?: (string)[],"title": string,"total_hours"?: number | null,"updated_at"?: string,"video_url"?: string | null
                  }
                  Update: {
                    "admission"?: string | null,"category_id"?: string | null,"certificate"?: string | null,"check_tier"?: Database["public"]['Enums']["check_tier"],"class_size_note"?: string | null,"created_at"?: string,"duration_months"?: number | null,"formats"?: (string)[],"hands_on_hours"?: number | null,"id"?: string,"institution_id"?: string,"institution_promises"?: string | null,"last_checked_at"?: string | null,"lecture_hours"?: number | null,"lecturers_note"?: string | null,"lecturers_summary"?: string | null,"next_cohort_date"?: string | null,"page_url"?: string | null,"product_type"?: string,"region"?: string | null,"schedule"?: string | null,"site_price_ils"?: number | null,"slug"?: string,"status"?: Database["public"]['Enums']["course_status"],"summary_good"?: string | null,"summary_weak"?: string | null,"syllabus"?: NonNullable<Json>,"time_slots"?: (string)[],"title"?: string,"total_hours"?: number | null,"updated_at"?: string,"video_url"?: string | null
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
                },"institution_requests": {
                  Row: {
                    "client_hash": string | null,"contact_email": string | null,"course_url": string,"created_at": string,"decided_at": string | null,"decided_by": string | null,"id": number,"institution_id": string | null,"institution_name": string,"page_id": number | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_hash"?: string | null,"contact_email"?: string | null,"course_url": string,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: never,"institution_id"?: string | null,"institution_name": string,"page_id"?: number | null,"status"?: string
                  }
                  Update: {
                    "client_hash"?: string | null,"contact_email"?: string | null,"course_url"?: string,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: never,"institution_id"?: string | null,"institution_name"?: string,"page_id"?: number | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "institution_requests_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institutions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "institution_requests_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "scrape_pages"
      referencedColumns: ["id"]
    }
                  ]
                },"institutions": {
                  Row: {
                    "business_number": string | null,"created_at": string,"id": string,"kind": string,"name": string,"slug": string,"status": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_number"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"name": string,"slug": string,"status"?: string,"website"?: string | null
                  }
                  Update: {
                    "business_number"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"name"?: string,"slug"?: string,"status"?: string,"website"?: string | null
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
                },"proof_check_usage": {
                  Row: {
                    "author_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"created_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"created_at"?: string
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
                },"reports": {
                  Row: {
                    "client_hash": string | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"details": string | null,"id": number,"reason": string,"review_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_hash"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"details"?: string | null,"id"?: never,"reason": string,"review_id": string,"status"?: string
                  }
                  Update: {
                    "client_hash"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"details"?: string | null,"id"?: never,"reason"?: string,"review_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_review_id_fkey"
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
                },"review_badges": {
                  Row: {
                    "created_at": string,"review_id": string,"show_name": boolean,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"review_id": string,"show_name"?: boolean,"token": string
                  }
                  Update: {
                    "created_at"?: string,"review_id"?: string,"show_name"?: boolean,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_badges_review_id_fkey"
      columns: ["review_id"]
isOneToOne: true
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
                },"scrape_pages": {
                  Row: {
                    "course_id": string | null,"fail_count": number,"first_seen_at": string,"id": number,"institution_id": string,"last_error": string | null,"last_extracted": Json | null,"last_fetched_at": string | null,"last_hash": string | null,"last_seen_at": string | null,"last_snapshot_id": number | null,"missing_count": number,"source": string,"state": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id"?: string | null,"fail_count"?: number,"first_seen_at"?: string,"id"?: never,"institution_id": string,"last_error"?: string | null,"last_extracted"?: Json | null,"last_fetched_at"?: string | null,"last_hash"?: string | null,"last_seen_at"?: string | null,"last_snapshot_id"?: number | null,"missing_count"?: number,"source"?: string,"state"?: string,"url": string
                  }
                  Update: {
                    "course_id"?: string | null,"fail_count"?: number,"first_seen_at"?: string,"id"?: never,"institution_id"?: string,"last_error"?: string | null,"last_extracted"?: Json | null,"last_fetched_at"?: string | null,"last_hash"?: string | null,"last_seen_at"?: string | null,"last_snapshot_id"?: number | null,"missing_count"?: number,"source"?: string,"state"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "scrape_pages_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "scrape_pages_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institutions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "scrape_pages_last_snapshot_fk"
      columns: ["last_snapshot_id"]
isOneToOne: false
      referencedRelation: "course_snapshots"
      referencedColumns: ["id"]
    }
                  ]
                },"scrape_runs": {
                  Row: {
                    "abort_reason": string | null,"changes_auto": number,"changes_queued": number,"courses_missing": number,"finished_at": string | null,"id": number,"model": string | null,"pages_changed": number,"pages_checked": number,"pages_failed": number,"pages_new": number,"pages_skipped": number,"pages_unchanged": number,"report": NonNullable<Json>,"started_at": string,"status": string,"trigger": string
                  }
                  ComputedFields: never
                  Insert: {
                    "abort_reason"?: string | null,"changes_auto"?: number,"changes_queued"?: number,"courses_missing"?: number,"finished_at"?: string | null,"id"?: never,"model"?: string | null,"pages_changed"?: number,"pages_checked"?: number,"pages_failed"?: number,"pages_new"?: number,"pages_skipped"?: number,"pages_unchanged"?: number,"report"?: NonNullable<Json>,"started_at"?: string,"status"?: string,"trigger": string
                  }
                  Update: {
                    "abort_reason"?: string | null,"changes_auto"?: number,"changes_queued"?: number,"courses_missing"?: number,"finished_at"?: string | null,"id"?: never,"model"?: string | null,"pages_changed"?: number,"pages_checked"?: number,"pages_failed"?: number,"pages_new"?: number,"pages_skipped"?: number,"pages_unchanged"?: number,"report"?: NonNullable<Json>,"started_at"?: string,"status"?: string,"trigger"?: string
                  }
                  Relationships: [
                    
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
            "approve_course_change":
{ Args: { "p_admin_id": string,"p_edit"?: boolean,"p_queue_id": number,"p_value"?: Json }; Returns: undefined
                           },
"approve_course_changes":
{ Args: { "p_admin_id": string,"p_ids": (number)[] }; Returns: {
              "course_slug": string,"queue_id": number
            }[]
                           },
"approve_course_submission":
{ Args: { "p_admin_id": string,"p_category_id"?: string,"p_institution_id"?: string,"p_institution_kind"?: string,"p_institution_name"?: string,"p_submission_id": number,"p_title"?: string }; Returns: Json
                           },
"approve_institution_request":
{ Args: { "p_admin_id": string,"p_institution_id": string,"p_request_id": number }; Returns: number
                           },
"count_review_read":
{ Args: { "p_review_id": string }; Returns: undefined
                           },
"course_link_queue":
{ Args: { "p_limit"?: number }; Returns: {
              "candidates": Json,"category_id": string,"category_name": string,"course_id": string,"course_slug": string,"course_title": string,"course_type": string,"created_at": string,"id": number,"institution_id": string,"institution_is_new": boolean,"institution_kind": string,"institution_name": string,"is_social": boolean,"known_page": boolean,"note": string,"reviews": Json,"source": string,"submitters": number,"suggested_institution_id": string,"total": number,"typed_institution": string,"typed_title": string,"url": string
            }[]
                           },
"course_link_type":
{ Args: { "p_course_id": string }; Returns: Database["public"]['Enums']["course_type"]
                           },
"course_paid_range":
{ Args: { "p_course_id": string }; Returns: {
              "invoice_count": number,"max_ils": number,"min_ils": number
            }[]
                           },
"course_queue_new_course_groups":
{ Args: Record<PropertyKey, never>; Returns: {
              "all_ids": (number)[],"causes": Json,"duplicates": number,"institution_id": string,"institution_name": string,"institution_slug": string,"oldest": string,"safe": number,"safe_ids": (number)[],"samples": Json,"total": number
            }[]
                           },
"course_queue_new_course_items":
{ Args: { "p_filter": string,"p_institution_id"?: string,"p_limit"?: number }; Returns: {
              "causes": (string)[],"institution_id": string,"queue_id": number,"total": number
            }[]
                           },
"decide_review_reports":
{ Args: { "p_admin_id": string,"p_decision": string,"p_note"?: string,"p_reason"?: string,"p_review_id": string }; Returns: string
                           },
"delete_review":
{ Args: { "p_action": string,"p_actor_id"?: string,"p_review_id": string }; Returns: {
              "course_slug": string,"was_published": boolean
            }[]
                           },
"forget_auth_log":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"get_ad_check":
{ Args: { "p_url": string }; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"merge_course_submission":
{ Args: { "p_admin_id": string,"p_submission_id": number,"p_target_course_id": string }; Returns: Json
                           },
"my_course_link":
{ Args: { "p_course_id": string }; Returns: Json
                           },
"my_course_links":
{ Args: Record<PropertyKey, never>; Returns: {
              "course_id": string,"course_title": string,"decision_reason": string,"institution_name": string,"status": string
            }[]
                           },
"my_review_badges":
{ Args: Record<PropertyKey, never>; Returns: {
              "review_id": string,"show_name": boolean,"token": string
            }[]
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
"purge_ad_checks":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_company_requests":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_course_submissions":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_institution_requests":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_reports":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"reject_course_change":
{ Args: { "p_admin_id": string,"p_queue_id": number }; Returns: undefined
                           },
"reject_course_changes":
{ Args: { "p_admin_id": string,"p_ids": (number)[] }; Returns: {
              "course_slug": string,"queue_id": number
            }[]
                           },
"reject_course_submission":
{ Args: { "p_admin_id": string,"p_reason": string,"p_submission_id": number }; Returns: undefined
                           },
"reject_institution_request":
{ Args: { "p_admin_id": string,"p_request_id": number }; Returns: undefined
                           },
"return_review":
{ Args: { "p_action": string,"p_admin_id": string,"p_note": string,"p_reason": string,"p_review_id": string }; Returns: undefined
                           },
"review_badge":
{ Args: { "p_token": string }; Returns: {
              "course_slug": string,"course_title": string,"institution_name": string,"shown_name": string,"shown_title": Database["public"]['Enums']["author_title"]
            }[]
                           },
"save_ad_check":
{ Args: { "p_result": Json,"p_url": string }; Returns: string
                           },
"scraper_apply_page":
{ Args: { "p_page": Json,"p_run_id": number }; Returns: Json
                           },
"scraper_finish_run":
{ Args: { "p_abort_reason"?: string,"p_counts": Json,"p_report": Json,"p_run_id": number,"p_status": string }; Returns: undefined
                           },
"scraper_mark_missing":
{ Args: { "p_institution_id": string,"p_run_id": number,"p_seen_urls": (string)[] }; Returns: number
                           },
"scraper_start_run":
{ Args: { "p_model": string,"p_trigger": string }; Returns: number
                           },
"set_company_request_status":
{ Args: { "p_admin_id": string,"p_request_id": number,"p_status": string }; Returns: undefined
                           },
"set_vendor_response":
{ Args: { "p_admin_id": string,"p_body": string,"p_review_id": string }; Returns: string
                           },
"share_review_badge":
{ Args: { "p_review_id": string,"p_show_name"?: boolean }; Returns: string
                           },
"submit_company_request":
{ Args: { "p_client_hash": string,"p_company_name": string,"p_contact_name": string,"p_email": string,"p_format"?: string,"p_needs": string,"p_phone"?: string,"p_team_size"?: string,"p_timing"?: string }; Returns: string
                           },
"submit_course_link":
{ Args: { "p_category_id"?: string,"p_course_type"?: Database["public"]['Enums']["course_type"],"p_institution_name": string,"p_title": string,"p_url": string,"p_user_id": string }; Returns: Json
                           },
"submit_course_request":
{ Args: { "p_client_hash": string,"p_name": string,"p_note": string,"p_url": string }; Returns: Json
                           },
"submit_institution_request":
{ Args: { "p_client_hash": string,"p_contact_email": string,"p_course_url": string,"p_institution_name": string }; Returns: string
                           },
"submit_review":
{ Args: { "p_author_id": string,"p_proofs": Json,"p_review_id": string,"p_validated": Json }; Returns: undefined
                           },
"submit_review_report":
{ Args: { "p_client_hash": string,"p_details"?: string,"p_reason": string,"p_review_id": string }; Returns: string
                           },
"take_ad_check":
{ Args: { "p_ip_hash": string }; Returns: boolean
                           },
"take_proof_checks":
{ Args: { "p_author_id": string,"p_per_day": number,"p_want": number }; Returns: number
                           },
"toggle_helpful":
{ Args: { "p_browser_id": string,"p_review_id": string }; Returns: {
              "is_helpful": boolean,"total": number
            }[]
                           },
"transparency_by_month":
{ Args: { "p_months"?: number }; Returns: {
              "course_changes_approved": number,"course_changes_rejected": number,"month": string,"proofs_deleted": number,"reported_reviews_kept": number,"reported_reviews_removed": number,"reviews_published": number,"reviews_returned": number
            }[]
                           },
"undo_course_change":
{ Args: { "p_admin_id": string,"p_change_id": number }; Returns: undefined
                           },
"unshare_review_badge":
{ Args: { "p_review_id": string }; Returns: boolean
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
