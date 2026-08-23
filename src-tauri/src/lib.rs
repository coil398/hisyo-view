mod plugins;
mod scan;
mod send;
mod feedback;
mod update;
mod secretary;
mod skills;
mod cloud;
mod worker;
mod launch;
mod permit;
mod extra;
mod notify;
mod xai;
mod openai;
mod providers;
mod pi;
mod work;
mod bridge;
mod widgets;
mod oauth;

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> Result<T, String> {
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_seats() -> Vec<scan::Seat> {
    blocking(scan::collect).await.unwrap_or_default()
}

#[tauri::command]
async fn list_cloud() -> Vec<scan::Seat> {
    blocking(|| {
        let home = std::env::var("HOME").map(std::path::PathBuf::from).unwrap_or_default();
        let plugins = plugins::load(&home);
        let enabled: Vec<String> = plugins.iter().filter(|p| p.enabled).map(|p| p.id.clone()).collect();
        cloud::seats(&enabled).into_iter().map(scan::from_cloud).collect()
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
async fn seat_detail(id: String) -> Option<scan::Seat> {
    blocking(move || scan::detail(&id)).await.ok().flatten()
}

#[tauri::command]
async fn list_plugins() -> Vec<plugins::Plugin> {
    blocking(|| {
        let home = std::env::var("HOME").map(std::path::PathBuf::from).unwrap_or_default();
        plugins::load(&home)
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
async fn send_prompt(runtime: String, session_id: String, cwd: String, text: String) -> Result<String, String> {
    blocking(move || {
        send::send(send::SendReq {
            runtime,
            session_id,
            cwd,
            text,
        })
    })
    .await?
}

#[tauri::command]
async fn save_plugin_settings(
    id: String,
    model: Option<String>,
    effort: Option<String>,
    enabled: bool,
    mode: Option<String>,
) -> Result<Vec<plugins::Plugin>, String> {
    blocking(move || plugins::save_plugin_settings(&id, model, effort, enabled, mode)).await?
}

#[tauri::command]
async fn decide_permit(
    runtime: String,
    session_id: String,
    cwd: String,
    action: String,
    call_id: String,
) -> Result<String, String> {
    blocking(move || {
        permit::decide(permit::DecideReq {
            runtime,
            session_id,
            cwd,
            action,
            call_id,
        })
    })
    .await?
}

#[tauri::command]
async fn create_feedback(
    title: String,
    body: String,
    images: Vec<feedback::FeedbackImage>,
) -> Result<String, String> {
    blocking(move || feedback::create(title, body, images)).await?
}

#[tauri::command]
async fn list_feedback() -> Result<Vec<feedback::FeedbackIssue>, String> {
    blocking(feedback::list).await?
}

#[tauri::command]
async fn feedback_thread(number: u64) -> Result<feedback::FeedbackThread, String> {
    blocking(move || feedback::thread(number)).await?
}

#[tauri::command]
async fn reply_feedback(number: u64, body: String) -> Result<String, String> {
    blocking(move || feedback::reply(number, body)).await?
}

#[tauri::command]
async fn check_update() -> Result<update::UpdateResult, String> {
    blocking(update::check).await?
}

#[tauri::command]
async fn install_update() -> Result<update::UpdateResult, String> {
    blocking(update::install).await?
}

#[tauri::command]
async fn secretary_state() -> Result<secretary::HomeState, String> {
    blocking(secretary::state).await?
}

#[tauri::command]
async fn secretary_ask(text: String, fleet: String, voice: Option<bool>) -> Result<secretary::AskOut, String> {
    blocking(move || secretary::ask(text, fleet, voice.unwrap_or(false))).await?
}

#[tauri::command]
async fn speak_text(text: String) -> Result<(), String> {
    blocking(move || secretary::speak(&text)).await?
}

#[tauri::command]
async fn secretary_providers() -> Vec<providers::Provider> {
    blocking(providers::list).await.unwrap_or_default()
}

#[tauri::command]
async fn list_jobs() -> Vec<work::Job> {
    blocking(work::list).await.unwrap_or_default()
}

#[tauri::command]
async fn add_job(title: String, body: String) -> work::Job {
    blocking(move || work::add(&title, &body)).await.unwrap_or_default()
}

#[tauri::command]
async fn assign_job(id: String, seat_id: String) -> Result<work::Job, String> {
    blocking(move || work::assign(&id, &seat_id)).await?
}

#[tauri::command]
async fn done_job(id: String) -> Result<work::Job, String> {
    blocking(move || work::done(&id)).await?
}

#[tauri::command]
async fn pop_job(id: String) -> Result<work::Job, String> {
    blocking(move || work::pop(&id)).await?
}

#[tauri::command]
async fn secretary_note(kind: String, text: String) -> Result<(), String> {
    blocking(move || secretary::note(kind, text)).await?
}

#[tauri::command]
async fn secretary_events() -> Result<Vec<secretary::EventLine>, String> {
    blocking(secretary::events).await?
}

#[tauri::command]
async fn secretary_ingest(
    items: Vec<secretary::EventIn>,
    heartbeat: Option<String>,
) -> Result<Vec<secretary::EventLine>, String> {
    blocking(move || secretary::ingest(items, heartbeat)).await?
}

#[tauri::command]
async fn save_secretary_runtime(runtime: String) -> Result<secretary::HomeState, String> {
    blocking(move || secretary::save_settings(Some(runtime), None)).await?
}

#[tauri::command]
async fn save_secretary_settings(
    runtime: Option<String>,
    model: Option<String>,
) -> Result<secretary::HomeState, String> {
    blocking(move || secretary::save_settings(runtime, model)).await?
}

#[tauri::command]
async fn list_skills() -> Result<Vec<skills::Skill>, String> {
    blocking(skills::list).await?
}

#[tauri::command]
async fn import_skill_paths(paths: Vec<String>) -> Result<Vec<skills::Skill>, String> {
    blocking(move || skills::import_paths(paths)).await?
}

#[tauri::command]
async fn import_skill_files(files: Vec<skills::SkillFileIn>) -> Result<Vec<skills::Skill>, String> {
    blocking(move || skills::import_files(files)).await?
}

#[tauri::command]
async fn set_skill_enabled(id: String, enabled: bool) -> Result<Vec<skills::Skill>, String> {
    blocking(move || skills::set_enabled(&id, enabled)).await?
}

#[tauri::command]
async fn remove_skill(id: String) -> Result<Vec<skills::Skill>, String> {
    blocking(move || skills::remove(&id)).await?
}

#[tauri::command]
fn reveal_skill(id: String) -> Result<(), String> {
    skills::reveal(&id)
}

#[tauri::command]
fn pick_skill_folder() -> Result<Option<String>, String> {
    skills::pick_folder()
}

#[tauri::command]
async fn skill_doc(id: String, rel: String) -> Result<skills::SkillDocBody, String> {
    blocking(move || skills::doc(&id, &rel)).await?
}

#[tauri::command]
async fn get_loop_settings() -> plugins::LoopSettings {
    blocking(plugins::get_loop).await.unwrap_or_else(|_| plugins::get_loop())
}

#[tauri::command]
async fn save_loop_settings(settings: plugins::LoopSettings) -> Result<plugins::LoopSettings, String> {
    blocking(move || plugins::save_loop(settings)).await?
}

#[tauri::command]
async fn launch_state() -> launch::LaunchState {
    blocking(launch::load).await.unwrap_or_default()
}

#[tauri::command]
async fn pick_launch_dir() -> Result<Option<String>, String> {
    launch::pick_dir()
}

#[tauri::command]
async fn launch_agent(req: launch::LaunchReq) -> Result<launch::LaunchState, String> {
    blocking(move || launch::launch(req)).await?
}

#[tauri::command]
async fn save_launch_preset(preset: launch::LaunchPreset) -> Result<launch::LaunchState, String> {
    blocking(move || launch::save_preset(preset)).await?
}

#[tauri::command]
async fn remove_launch_preset(id: String) -> Result<launch::LaunchState, String> {
    blocking(move || launch::remove_preset(&id)).await?
}

#[tauri::command]
async fn bridge_info() -> bridge::BridgeInfo {
    blocking(bridge::info).await.unwrap_or(bridge::BridgeInfo {
        on: false,
        port: 4747,
        token: String::new(),
        urls: vec![],
        remote: String::new(),
        via: String::new(),
        missing: String::new(),
    })
}

#[tauri::command]
async fn set_bridge(on: bool) -> Result<bridge::BridgeInfo, String> {
    blocking(move || bridge::set_on(on)).await?
}

#[tauri::command]
async fn rotate_bridge() -> Result<bridge::BridgeInfo, String> {
    blocking(bridge::rotate).await?
}

#[tauri::command]
async fn publish_bridge() -> Result<bridge::BridgeInfo, String> {
    blocking(bridge::publish).await?
}

#[tauri::command]
async fn get_features() -> extra::Features {
    blocking(extra::get).await.unwrap_or_default()
}

#[tauri::command]
async fn save_features(features: extra::Features) -> Result<extra::Features, String> {
    blocking(move || extra::save(features)).await?
}

#[tauri::command]
async fn list_pins() -> Vec<String> {
    blocking(extra::pins).await.unwrap_or_default()
}

#[tauri::command]
async fn set_pin(id: String, on: bool) -> Result<Vec<String>, String> {
    blocking(move || extra::set_pin(id, on)).await?
}

#[tauri::command]
async fn halt_agent(runtime: String, session_id: String, cwd: String, action: String) -> Result<String, String> {
    blocking(move || extra::halt(runtime, session_id, cwd, action)).await?
}

#[tauri::command]
async fn search_seats(q: String) -> Vec<extra::Hit> {
    blocking(move || extra::search(q)).await.unwrap_or_default()
}

#[tauri::command]
async fn write_memory(kind: String, text: String) -> Result<(), String> {
    blocking(move || extra::write_memory(kind, text)).await?
}

#[tauri::command]
async fn secretary_briefing() -> Result<String, String> {
    blocking(extra::briefing).await?
}

#[tauri::command]
async fn import_skill_github(url: String) -> Result<Vec<skills::Skill>, String> {
    blocking(move || extra::import_github(url)).await?
}

#[tauri::command]
async fn export_settings() -> Result<String, String> {
    blocking(extra::export_settings).await?
}

#[tauri::command]
async fn read_audit() -> Vec<serde_json::Value> {
    blocking(extra::audit_read).await.unwrap_or_default()
}

#[tauri::command]
async fn inbox_image(name: String, b64: String) -> Result<String, String> {
    blocking(move || extra::inbox_image(name, b64)).await?
}

#[tauri::command]
async fn widget_state() -> widgets::WidgetState {
    blocking(widgets::state).await.unwrap_or_else(|_| widgets::state())
}

#[tauri::command]
async fn widget_save(cfg: widgets::WidgetCfg) -> Result<widgets::WidgetCfg, String> {
    blocking(move || widgets::save(cfg)).await?
}

#[tauri::command]
async fn widget_reset() -> Result<widgets::WidgetCfg, String> {
    blocking(widgets::reset).await?
}

#[tauri::command]
async fn widget_google_login() -> Result<String, String> {
    blocking(widgets::google_login).await?
}

#[tauri::command]
async fn widget_google_logout() -> Result<widgets::WidgetCfg, String> {
    blocking(widgets::google_logout).await?
}

#[tauri::command]
async fn widget_connect_mac(kind: String) -> Result<String, String> {
    blocking(move || widgets::connect_mac(&kind)).await?
}

#[tauri::command]
async fn widget_notion_login() -> Result<String, String> {
    blocking(widgets::notion_login).await?
}

#[tauri::command]
async fn widget_notion_logout() -> Result<widgets::WidgetCfg, String> {
    blocking(widgets::notion_logout).await?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            worker::start(app.handle().clone());
            bridge::start();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_seats,
            list_cloud,
            seat_detail,
            list_plugins,
            send_prompt,
            save_plugin_settings,
            decide_permit,
            create_feedback,
            list_feedback,
            feedback_thread,
            reply_feedback,
            check_update,
            install_update,
            secretary_state,
            secretary_ask,
            speak_text,
            secretary_providers,
            list_jobs,
            add_job,
            assign_job,
            done_job,
            pop_job,
            secretary_note,
            secretary_events,
            secretary_ingest,
            save_secretary_runtime,
            save_secretary_settings,
            list_skills,
            import_skill_paths,
            import_skill_files,
            set_skill_enabled,
            remove_skill,
            reveal_skill,
            pick_skill_folder,
            skill_doc,
            get_loop_settings,
            save_loop_settings,
            launch_state,
            pick_launch_dir,
            launch_agent,
            save_launch_preset,
            remove_launch_preset,
            bridge_info,
            set_bridge,
            rotate_bridge,
            publish_bridge,
            get_features,
            save_features,
            list_pins,
            set_pin,
            halt_agent,
            search_seats,
            write_memory,
            secretary_briefing,
            import_skill_github,
            export_settings,
            read_audit,
            inbox_image,
            widget_state,
            widget_save,
            widget_reset,
            widget_google_login,
            widget_google_logout,
            widget_connect_mac,
            widget_notion_login,
            widget_notion_logout
        ])
        .run(tauri::generate_context!())
        .expect("error while running HISYO VIEW");
}
