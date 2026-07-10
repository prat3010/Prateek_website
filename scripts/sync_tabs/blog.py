import streamlit as st
import os
import json
from datetime import datetime
from sync_tabs.shared import (
    parse_projects_file,
    parse_skills_file,
    run_safe_git_command,
    fetch_github_repo_metadata,
    call_gemini,
    run_async_task,
    validate_blog_fields,
    slugify,
    atomic_write_text,
    parse_resume_file,
    write_resume_file,
    git_commit_push_file,
    trigger_revalidation,
    delete_blog_post,
    HAS_SYNC,
    read_local_path_context
)
from sync_git import commit_and_push_paths

def render_blog_tab():
    st.markdown('<div class="section-header">AI Blog Writer & Publisher</div>', unsafe_allow_html=True)
    st.write("Draft professional developer logs, tutorials, and post updates using the Gemini co-pilot, and publish them directly to your website.")
    
    # 💡 Brainstorm Ideas from Codebase
    st.subheader("💡 Brainstorm Ideas from Codebase")
    st.write("Let Gemini analyze your projects, skills, package dependencies, and recent git commits to propose engineering blog topics.")

    ideas_status = st.session_state.get("blog_ideas_task_status", "idle")

    if ideas_status == "success":
        ideas_res = st.session_state.get("blog_ideas_task_result")
        if ideas_res:
            ideas_list = ideas_res.get("ideas", [])
            st.session_state.blog_brainstormed_ideas = ideas_list
            if ideas_list:
                st.success("Successfully generated blog ideas!")
            else:
                st.warning("⚠️ No ideas were returned by Gemini. Please try again or check your codebase metadata.")
        else:
            st.warning("⚠️ Brainstorm task completed, but returned empty results.")
        st.session_state.blog_ideas_task_status = "idle"
    elif ideas_status == "error":
        ideas_err = st.session_state.get("blog_ideas_task_error", "Unknown error")
        st.error(f"Error brainstorming ideas: {ideas_err}")
        st.session_state.blog_ideas_task_status = "idle"

    if ideas_status == "running":
        st.info("🧠 Analyzing codebase metadata and brainstorming technical articles...")
        st.markdown(
            '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">'
            '<div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border .75s linear infinite;"></div>'
            '<span>Brainstorming ideas. Feel free to browse other tabs!</span>'
            '</div>'
            '<style>@keyframes spinner-border { to { transform: rotate(360deg); } }</style>',
            unsafe_allow_html=True
        )

    # Fetch projects for multi-select
    projects_list = []
    try:
        projects_list = parse_projects_file()
    except Exception:
        pass

    projects_with_github = ["Current Website Codebase (Prateek_website)"]
    if projects_list:
        projects_with_github.extend([
            p.get("title") for p in projects_list 
            if p.get("title") and p.get("githubUrl")
        ])

    selected_github_projects = st.multiselect(
        "Select projects to fetch GitHub repository details for deeper analysis:",
        options=projects_with_github,
        default=["Current Website Codebase (Prateek_website)"],
        help="For selected projects, the brainstormer will fetch their README and recent commits directly from GitHub (or locally for the website) to build highly specific blog topics."
    )

    st.text_input(
        "Brainstorm Focus / Technical Angle (optional):",
        placeholder="e.g. Focus on Delta-E color math, state tracking with isolates, or microservices migration...",
        key="blog_brainstorm_focus",
        help="Direct the AI to focus on specific topics, files, or technical concepts when brainstorming ideas."
    )

    analyze_local_diff = st.checkbox(
        "Analyze local uncommitted changes & recent diffs",
        value=True,
        key="blog_brainstorm_analyze_diffs",
        help="Reads unstaged/staged code diffs and recent commit history to suggest case studies about your exact changes."
    )

    col_brainstorm, col_clear = st.columns([3, 1])
    with col_brainstorm:
        btn_ideas_disabled = (ideas_status == "running")
        if st.button("Brainstorm 5 Blog Ideas", use_container_width=True, disabled=btn_ideas_disabled, key="btn_brainstorm_blog"):
            github_urls_to_fetch = {}
            include_current_website_codebase = False
            for proj_title in selected_github_projects:
                if proj_title == "Current Website Codebase (Prateek_website)":
                    include_current_website_codebase = True
                    continue
                for p in projects_list:
                    if p.get("title") == proj_title and p.get("githubUrl"):
                        github_urls_to_fetch[proj_title] = p.get("githubUrl")
                        break

            def run_brainstorm():
                context = {}
                try:
                    context['projects'] = [
                        {
                            'title': p.get('title'),
                            'description': p.get('description'),
                            'tech': p.get('tech', [])
                        }
                        for p in projects_list
                        if p.get('title') in selected_github_projects
                    ]
                    if "Current Website Codebase (Prateek_website)" in selected_github_projects:
                        context['projects'].append({
                            'title': "Current Website Codebase (Prateek_website)",
                            'description': "This Next.js portfolio website codebase.",
                            'tech': ["Next.js 16", "React 19", "TypeScript", "TailwindCSS", "Supabase", "Framer Motion"]
                        })
                except Exception:
                    pass
                try:
                    skills = parse_skills_file()
                    if skills:
                        context['skills'] = [s.get('name') for s in skills if s.get('name')][:15]
                except Exception:
                    pass
                try:
                    success, logs = run_safe_git_command(["git", "log", "-n", "8", "--oneline"], cwd=os.getcwd())
                    if success:
                        context['recent_commits'] = logs.strip().split('\n')
                except Exception:
                    pass
                try:
                    if os.path.exists("package.json"):
                        with open("package.json", "r") as f:
                            pkg = json.load(f)
                            context['dependencies'] = list(pkg.get('dependencies', {}).keys())
                except Exception:
                    pass

                # Gather local Git changes & diff context if enabled
                if analyze_local_diff:
                    git_changes = {}
                    
                    # 1. Gather porcelain status list
                    status_ok, status_out = run_safe_git_command(["git", "status", "--porcelain"], cwd=os.getcwd())
                    if status_ok:
                        git_changes['touched_files'] = [line.strip() for line in status_out.splitlines() if line.strip()]
                        
                    # 2. Gather unstaged diff
                    diff_ok, diff_out = run_safe_git_command(["git", "diff"], cwd=os.getcwd())
                    if diff_ok and diff_out.strip():
                        git_changes['unstaged_diff'] = diff_out[:3000]
                        
                    # 3. Gather staged diff
                    cached_ok, cached_out = run_safe_git_command(["git", "diff", "--cached"], cwd=os.getcwd())
                    if cached_ok and cached_out.strip():
                        git_changes['staged_diff'] = cached_out[:2000]
                        
                    # 4. Gather recent commit diff (HEAD~1..HEAD)
                    recent_ok, recent_out = run_safe_git_command(["git", "diff", "HEAD~1", "HEAD"], cwd=os.getcwd())
                    if recent_ok and recent_out.strip():
                        git_changes['recent_commit_diff'] = recent_out[:2000]
                        
                    context['git_changes'] = git_changes

                if github_urls_to_fetch or include_current_website_codebase:
                    context['github_repositories'] = {}
                    
                    if include_current_website_codebase:
                        website_readme = "No README found."
                        try:
                            if os.path.exists("README.md"):
                                with open("README.md", "r", encoding="utf-8") as f:
                                    website_readme = f.read()[:1500]
                        except Exception:
                            pass
                        
                        context['github_repositories']["Current Website Codebase (Prateek_website)"] = {
                            "slug": "prat3010/Prateek_website",
                            "readme": website_readme,
                            "recent_commits": "\n".join(context.get('recent_commits', []))
                        }

                    for title, url in github_urls_to_fetch.items():
                        repo_meta = fetch_github_repo_metadata(url)
                        if repo_meta:
                            context['github_repositories'][title] = repo_meta

                focus_guidance = st.session_state.get("blog_brainstorm_focus", "").strip()
                focus_clause = ""
                if focus_guidance:
                    focus_clause = f"\n[FOCUS INSTRUCTION / TECHNICAL ANGLE]\nThe user wants you to focus on: {focus_guidance}\nEnsure your generated blog ideas specifically highlight, center around, or touch upon this technical focus or feature.\n"

                prompt = f"""
                You are a senior full-stack developer and technical blogger. 
                Analyze the following codebase metadata (projects, skills, package dependencies, recent git commits, and local workspace changes / diffs), including detailed fetched repository files/commits:
                
                [CODEBASE CONTEXT]
                {json.dumps(context, indent=2)}
                {focus_clause}
                
                If `git_changes` is present in the context, pay special attention to the modified/staged files and raw diff content. They represent the developer's immediate local code accomplishments and implementation changes. Design at least 2 of the 5 blog ideas to be "Dev Logs" or deep dives focusing on these exact changes, detailing the architectural decisions, code changes, algorithms, and engineering challenges solved by them.
                
                Generate a list of 5 creative, highly technical, and engaging blog post ideas that would fit perfectly on this developer's portfolio.
                For each idea, return:
                1. A catchy, SEO-optimized title.
                2. A short paragraph describing the technical details, challenges, or architectural decisions that could be discussed in the post.
                3. A ready-to-use structured prompt/notes block (150-300 words) explaining the technical details, background, and solution of the topic so that a blog generator can write it.
                
                Generate and return strictly the following JSON structure:
                {{
                  "ideas": [
                    {{
                      "title": "A catchy, SEO-optimized title",
                      "description": "Short paragraph describing what the post will cover.",
                      "notes": "A detailed, raw notes block (150-300 words) explaining the technical details, background, and solution of the topic so that a blog generator can write it."
                    }}
                  ]
                }}
                Do not return any conversational text, markdown formatting wrappers outside the JSON, or backticks. Return only the raw JSON.
                """

                res = call_gemini(prompt)
                if res is None:
                    raise ValueError("Failed to generate blog ideas from Gemini.")
                return res

            run_async_task(run_brainstorm, "blog_ideas_task")
            st.rerun()

    with col_clear:
        if st.button("Clear Ideas", use_container_width=True, key="btn_clear_ideas"):
            if "blog_brainstormed_ideas" in st.session_state:
                del st.session_state.blog_brainstormed_ideas
            if "blog_ideas_task_status" in st.session_state:
                st.session_state.blog_ideas_task_status = "idle"
            if "blog_ideas_task_error" in st.session_state:
                st.session_state.blog_ideas_task_error = None
            st.rerun()

    brainstormed_ideas = st.session_state.get("blog_brainstormed_ideas", [])
    if brainstormed_ideas:
        st.write("### Proposed Blog Ideas:")
        for idx, idea in enumerate(brainstormed_ideas):
            with st.expander(f"💡 {idea.get('title', 'Idea ' + str(idx+1))}"):
                st.write(idea.get('description', ''))
                st.markdown("**Structured raw notes for generator:**")
                st.code(idea.get('notes', ''), language="markdown")
                if st.button(f"👉 Use this Idea", key=f"btn_use_idea_{idx}"):
                    st.session_state.blog_draft_title = idea.get('title', '')
                    st.session_state.blog_draft_raw_notes = idea.get('notes', '')
                    st.toast(f"Selected: {idea.get('title')}")
                    st.rerun()

    st.write("---")

    # AI Assist inputs
    st.subheader("AI Ghostwriter Co-Pilot")
    raw_notes = st.text_area(
        "1. Paste your raw notes, debug outputs, or code snippets here:",
        height=150,
        placeholder="E.g. Fixed resume PDF download using jsPDF to create a vector layout so text remains selectable and ATS-compliant...",
        key="blog_draft_raw_notes"
    )
    
    local_path = st.text_input(
        "2. Or reference a local file or directory path relative to project root (optional):",
        placeholder="e.g. src/components/Terminal/Terminal.tsx or src/utils/pdfGenerator.ts",
        key="blog_draft_local_path",
        help="Reads files or directory contents and includes them as source code context for the generator."
    )
    
    tone = st.selectbox("Choose Tone:", ["Professional & Technical", "Conversational & Casual", "Tutorial / How-To Style"], key="blog_draft_tone")
    
    blog_status = st.session_state.get("blog_draft_task_status", "idle")
    
    if blog_status == "success":
        res = st.session_state.get("blog_draft_task_result")
        if res:
            st.session_state.blog_draft_title = res.get("title", "")
            st.session_state.blog_draft_excerpt = res.get("excerpt", "")
            st.session_state.blog_draft_content = res.get("content", "")
            st.success("Draft generated! Review it below.")
        st.session_state.blog_draft_task_status = "idle"
    elif blog_status == "error":
        err_msg = st.session_state.get("blog_draft_task_error", "Unknown error")
        st.error(f"Error generating draft: {err_msg}")
        st.session_state.blog_draft_task_status = "idle"
        
    if blog_status == "running":
        st.info("🤖 Translating notes into a professional article in the background...")
        st.markdown(
            '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">'
            '<div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border .75s linear infinite;"></div>'
            '<span>Gemini is generating your draft. Feel free to edit other parts or switch tabs!</span>'
            '</div>'
            '<style>@keyframes spinner-border { to { transform: rotate(360deg); } }</style>',
            unsafe_allow_html=True
        )

    btn_disabled = (blog_status == "running")
    if st.button("Draft Blog Post with AI", use_container_width=True, disabled=btn_disabled, key="btn_draft_blog"):
        local_path_val = st.session_state.get("blog_draft_local_path", "").strip()
        if not raw_notes and not local_path_val:
            st.error("Please add some raw notes/code OR reference a local path first!")
        else:
            path_context = ""
            if local_path_val:
                ok, res_context = read_local_path_context(local_path_val)
                if not ok:
                    st.error(res_context)
                    st.stop()
                path_context = res_context

            context_blocks = []
            if raw_notes:
                context_blocks.append(f"[RAW NOTES / CODE]\n{raw_notes}")
            if path_context:
                context_blocks.append(f"[SOURCE CODE CONTEXT]\n{path_context}")

            prompt = f"""
            You are a senior full-stack developer and technical writer. 
            Your task is to write a highly engaging, clear, and professional developer blog post based on these source code files and notes:
            
            {"\n\n".join(context_blocks)}
            
            [TONE]
            {tone}
            
            Generate and return strictly the following JSON structure:
            {{
              "title": "A catchy, SEO-optimized title for the blog post (e.g. 'How to solve X with Y')",
              "excerpt": "A short, 1-2 sentence description summarizing the post's takeaways",
              "content": "The full body content of the blog post in standard Markdown format. Use clear headings (e.g. ##, ###), bullets, blockquotes, and code blocks for technical details. Focus on clarity, engineering details, and keep it direct. Avoid standard AI greeting fillers or concluding phrases like 'In conclusion'."
            }}
            Do not return any conversational text, markdown formatting wrappers outside the JSON, or backticks. Return only the raw JSON.
            """
            
            def run_blog_generation():
                res = call_gemini(prompt)
                if res is None:
                    raise ValueError("Failed to generate blog post from Gemini. Please verify API key, logs, or network.")
                return res
                
            run_async_task(run_blog_generation, "blog_draft_task")
            st.rerun()
                    
    st.subheader("Edit & Publish Post")
    
    draft_title = st.text_input("Title:", key="blog_draft_title")
    draft_excerpt = st.text_area("Excerpt / Summary:", key="blog_draft_excerpt")
    draft_tags = st.text_input("Tags (comma separated):", key="blog_draft_tags")
    draft_content = st.text_area("Markdown Body Content:", height=350, key="blog_draft_content")
    
    # 🔍 SEO & Keyword Analysis Section
    with st.expander("🔍 SEO & Keyword Analysis", expanded=True):
        col_seo_input, col_seo_results = st.columns([1, 1])
        with col_seo_input:
            focus_keyword = st.text_input(
                "Focus Keyword (for audit):", 
                key="blog_focus_keyword",
                placeholder="e.g. Next.js, API, python"
            )
            
            seo_task_status = st.session_state.get("blog_seo_review_task_status", "idle")
            seo_btn_disabled = (seo_task_status == "running")
            
            if st.button("Ask Gemini for SEO Review", key="btn_gemini_seo", disabled=seo_btn_disabled, use_container_width=True):
                if not draft_title or not draft_content:
                    st.error("Please fill in Title and Markdown Content first!")
                else:
                    seo_prompt = f"""
                    You are an expert SEO auditor and copywriter.
                    Analyze the following blog post details and focus keyword, and provide a clean audit report:
                    
                    Title: {draft_title}
                    Excerpt: {draft_excerpt}
                    Focus Keyword: {focus_keyword}
                    
                    Content:
                    {draft_content}
                    
                    Generate and return strictly the following JSON structure:
                    {{
                      "readability_grade": "e.g. 8th Grade (Easy to read)",
                      "suggested_titles": [
                        "Title alternative 1",
                        "Title alternative 2",
                        "Title alternative 3"
                      ],
                      "meta_description": "Suggested optimized 150-char meta description",
                      "seo_recommendations": [
                        "Recommendation 1",
                        "Recommendation 2",
                        "Recommendation 3"
                      ]
                    }}
                    Do not return any conversational text, markdown formatting wrappers outside the JSON, or backticks. Return only the raw JSON.
                    """
                    
                    def run_seo_review():
                        res = call_gemini(seo_prompt)
                        if res is None:
                            raise ValueError("Failed to get SEO review from Gemini.")
                        return res
                        
                    run_async_task(run_seo_review, "blog_seo_review_task")
                    st.rerun()

        with col_seo_results:
            title_len = len(draft_title) if draft_title else 0
            if 40 <= title_len <= 60:
                st.markdown("🟢 **Title Length:** Good (40-60 chars)")
            elif title_len == 0:
                st.markdown("🔴 **Title Length:** Empty (Target: 40-60)")
            else:
                st.markdown(f"🔴 **Title Length:** {title_len} chars (Target: 40-60)")
                
            excerpt_len = len(draft_excerpt) if draft_excerpt else 0
            if 120 <= excerpt_len <= 160:
                st.markdown("🟢 **Excerpt Length:** Good (120-160 chars)")
            elif excerpt_len == 0:
                st.markdown("🔴 **Excerpt Length:** Empty (Target: 120-160)")
            else:
                st.markdown(f"🟡 **Excerpt Length:** {excerpt_len} chars (Target: 120-160)")
                
            if focus_keyword:
                kw = focus_keyword.lower().strip()
                if draft_title and kw in draft_title.lower():
                    st.markdown("🟢 **Keyword in Title:** Yes")
                else:
                    st.markdown("🔴 **Keyword in Title:** No")
                    
                if draft_excerpt and kw in draft_excerpt.lower():
                    st.markdown("🟢 **Keyword in Excerpt:** Yes")
                else:
                    st.markdown("🔴 **Keyword in Excerpt:** No")
                    
                body_lower = draft_content.lower() if draft_content else ""
                kw_count = body_lower.count(kw)
                words = [w for w in body_lower.split() if w.strip()]
                word_count = len(words)
                density = (kw_count / word_count * 100) if word_count > 0 else 0
                
                if 1.0 <= density <= 2.5:
                    st.markdown(f"🟢 **Keyword Density:** {density:.2f}% (Good, count: {kw_count})")
                elif density < 1.0:
                    st.markdown(f"🟡 **Keyword Density:** {density:.2f}% (Too low, target: 1-2.5%, count: {kw_count})")
                else:
                    st.markdown(f"🔴 **Keyword Density:** {density:.2f}% (Stuffing detected! target: 1-2.5%, count: {kw_count})")
                    
                has_in_headings = False
                for line in body_lower.split('\n'):
                    if line.startswith('##') and kw in line:
                        has_in_headings = True
                        break
                if has_in_headings:
                    st.markdown("🟢 **Keyword in Headings (H2/H3):** Yes")
                else:
                    st.markdown("🟡 **Keyword in Headings (H2/H3):** No")
            else:
                st.info("Enter a focus keyword to run keyword density audits.")

        if seo_task_status == "success":
            seo_res = st.session_state.get("blog_seo_review_task_result")
            if seo_res:
                st.markdown("---")
                st.markdown("### 🤖 Gemini SEO Review:")
                st.markdown(f"**Readability:** {seo_res.get('readability_grade', 'N/A')}")
                st.markdown(f"**Meta Description Proposal:** `{seo_res.get('meta_description', '')}`")
                
                col_titles, col_recs = st.columns(2)
                with col_titles:
                    st.markdown("**Suggested Headline Variations:**")
                    for t_opt in seo_res.get("suggested_titles", []):
                        st.markdown(f"- {t_opt}")
                with col_recs:
                    st.markdown("**SEO Recommendations:**")
                    for rec in seo_res.get("seo_recommendations", []):
                        st.markdown(f"- {rec}")
                        
            st.session_state.blog_seo_review_task_status = "idle"
        elif seo_task_status == "error":
            err = st.session_state.get("blog_seo_review_task_error", "Unknown error")
            st.error(f"SEO Review failed: {err}")
            st.session_state.blog_seo_review_task_status = "idle"
            
        if seo_task_status == "running":
            st.info("🤖 Gemini is auditing your content and generating SEO guidelines...")

    dry_run_blog = st.checkbox("Dry-Run Mode (Save to Supabase/locally, skip Git remote push)", value=True, key="dry_blog")
    
    if st.button("Publish Blog Post", use_container_width=True, type="primary"):
        try:
            tags_parsed = [t.strip() for t in draft_tags.split(",") if t.strip()]
            validated_title, validated_excerpt, tags_list, validated_content = validate_blog_fields(
                draft_title,
                draft_excerpt,
                tags_parsed,
                draft_content,
            )
            slug = slugify(validated_title)
            date_str = st.session_state.get("blog_draft_date", datetime.now().strftime('%Y-%m-%d'))
            
            file_content = f"""---
title: {json.dumps(validated_title)}
date: {json.dumps(date_str)}
excerpt: {json.dumps(validated_excerpt)}
tags: {json.dumps(tags_list)}
coverImage: "/images/blog/default.jpg"
---

{validated_content}
"""
            is_offline = st.session_state.get("offline_mode", False)
            supabase_success = True
            
            if HAS_SYNC and not is_offline:
                st.info("Syncing blog post to Supabase...")
                post_data = {
                    'slug': slug,
                    'title': validated_title,
                    'date': date_str,
                    'excerpt': validated_excerpt,
                    'tags': tags_list,
                    'coverImage': '/images/blog/default.jpg',
                    'content': validated_content
                }
                res = sync_blog_post(post_data)
                if res is None:
                    supabase_success = False
                    st.error("Failed to sync blog post to Supabase.")
            
            if supabase_success:
                try:
                    posts_dir = os.path.join("src", "content", "posts")
                    os.makedirs(posts_dir, exist_ok=True)
                    file_path = os.path.join(posts_dir, f"{slug}.md")
                    atomic_write_text(file_path, file_content)
                    
                    resume = parse_resume_file()
                    if resume:
                        if 'lastSynced' not in resume:
                            resume['lastSynced'] = {}
                        resume['lastSynced'] = {
                            "timestamp": datetime.now().isoformat(),
                            "status": "success",
                            "summary": f"Published blog post: {validated_title}"
                        }
                        write_resume_file(resume)
                        st.session_state.resume = resume
                    
                    st.success(f"Successfully published blog post locally! File created at: `{file_path}`")
                    
                    if HAS_SYNC and not is_offline:
                        st.info("Purging website cache...")
                        trigger_revalidation()
                        st.success("Website cache revalidated successfully!")
                    
                    if not dry_run_blog:
                        st.info("🚀 Pushing changes to GitHub...")
                        git_ok, git_msg = commit_and_push_paths(
                            run_safe_git_command,
                            [file_path, "src/data/resume.json"],
                            f"chore(blog): publish post - {validated_title}",
                            cwd=os.getcwd(),
                        )
                        if git_ok:
                            st.success(git_msg)
                        else:
                            st.error(f"Git failed: {git_msg}")
                    
                    if "blog_draft_title" in st.session_state: del st.session_state.blog_draft_title
                    if "blog_draft_excerpt" in st.session_state: del st.session_state.blog_draft_excerpt
                    if "blog_draft_content" in st.session_state: del st.session_state.blog_draft_content
                    if "blog_draft_tags" in st.session_state: del st.session_state.blog_draft_tags
                    if "blog_draft_date" in st.session_state: del st.session_state.blog_draft_date
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"Failed to publish post: {e}")
        except Exception as e:
            st.error(str(e))

    st.markdown("---")
    st.subheader("Already Published Logs")
    
    posts_dir = os.path.join("src", "content", "posts")
    if os.path.exists(posts_dir):
        post_files = [f for f in os.listdir(posts_dir) if f.endswith(".md")]
        
        if not post_files:
            st.info("No blog posts found on the website.")
        else:
            posts_data = []
            for file_name in post_files:
                file_path = os.path.join(posts_dir, file_name)
                post_title = file_name
                post_date = ""
                post_excerpt = ""
                post_tags_list = []
                post_body = ""
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        file_content = f.read()
                    post_body = file_content
                    if file_content.startswith("---"):
                        parts = file_content.split("---", 2)
                        if len(parts) >= 3:
                            frontmatter = parts[1]
                            post_body = parts[2].strip()
                            for line in frontmatter.split("\n"):
                                line = line.strip()
                                if line.startswith("title:"):
                                    post_title = line.split("title:", 1)[1].strip().strip('"').strip("'")
                                  # handle backslashes or other characters if needed
                                elif line.startswith("date:"):
                                    post_date = line.split("date:", 1)[1].strip().strip('"').strip("'")
                                elif line.startswith("excerpt:"):
                                    post_excerpt = line.split("excerpt:", 1)[1].strip().strip('"').strip("'")
                                elif line.startswith("tags:"):
                                    tags_str = line.split("tags:", 1)[1].strip()
                                    try:
                                        post_tags_list = json.loads(tags_str)
                                    except Exception:
                                        tags_clean = tags_str.replace("[", "").replace("]", "").replace('"', '').replace("'", "")
                                        post_tags_list = [t.strip() for t in tags_clean.split(",") if t.strip()]
                except Exception:
                    pass
                
                posts_data.append({
                    "file_name": file_name,
                    "file_path": file_path,
                    "title": post_title,
                    "date": post_date,
                    "excerpt": post_excerpt,
                    "tags": post_tags_list,
                    "body": post_body
                })
            
            posts_data.sort(key=lambda x: x["date"] or "0000-00-00", reverse=True)
            
            for post in posts_data:
                with st.container(border=True):
                    col_info, col_edit, col_del = st.columns([5, 1, 1.2])
                    with col_info:
                        st.markdown(f"**{post['title']}**")
                        st.caption(f"Date: {post['date'] if post['date'] else 'No Date'} | File: `{post['file_name']}`")
                    with col_edit:
                        edit_key = f"edit_{post['file_name']}"
                        if st.button("Edit", key=edit_key, type="secondary", use_container_width=True):
                            st.session_state.blog_draft_title = post['title']
                            st.session_state.blog_draft_excerpt = post['excerpt']
                            st.session_state.blog_draft_tags = ", ".join(post['tags'])
                            st.session_state.blog_draft_content = post['body']
                            st.session_state.blog_draft_date = post['date']
                            st.rerun()
                    with col_del:
                        btn_key = f"delete_{post['file_name']}"
                        if st.button("Remove", key=btn_key, type="secondary", use_container_width=True):
                            try:
                                os.remove(post['file_path'])
                            except Exception as e:
                                st.error(f"Error deleting file: {e}")
                            
                            is_offline = st.session_state.get("offline_mode", False)
                            if HAS_SYNC and not is_offline:
                                slug = post['file_name'].replace(".md", "")
                                if delete_blog_post(slug):
                                    trigger_revalidation()
                                else:
                                    st.error("Deleted local blog file, but Supabase delete failed.")
                            
                            st.success(f"Deleted `{post['file_name']}` successfully!")
                            st.rerun()
    else:
        st.info("No blog posts directory found.")
