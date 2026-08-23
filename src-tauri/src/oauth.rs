use serde::Deserialize;
use std::fs;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct OAuthFile {
    #[serde(default)] pub google_client_id: String,
    #[serde(default)] pub google_client_secret: String,
    #[serde(default)] pub notion_client_id: String,
    #[serde(default)] pub notion_client_secret: String,
}
fn oauth_path()->PathBuf{let home=std::env::var("HOME").unwrap_or_default();PathBuf::from(home).join(".hisyo/oauth.json")}
pub fn load_file()->OAuthFile{let raw=fs::read_to_string(oauth_path()).unwrap_or_default();serde_json::from_str(&raw).unwrap_or_default()}
fn pick(vals:&[String])->String{vals.iter().map(|s|s.trim()).find(|s|!s.is_empty()).unwrap_or("").to_string()}
pub fn google_client(cfg_id:&str,cfg_secret:&str)->(String,String){let f=load_file();let id=pick(&[cfg_id.into(),f.google_client_id,std::env::var("HISYO_GOOGLE_CLIENT_ID").unwrap_or_default()]);let secret=pick(&[cfg_secret.into(),f.google_client_secret,std::env::var("HISYO_GOOGLE_CLIENT_SECRET").unwrap_or_default()]);(id,secret)}
pub fn notion_client()->(String,String){let f=load_file();let id=pick(&[f.notion_client_id,std::env::var("HISYO_NOTION_CLIENT_ID").unwrap_or_default()]);let secret=pick(&[f.notion_client_secret,std::env::var("HISYO_NOTION_CLIENT_SECRET").unwrap_or_default()]);(id,secret)}
pub fn pkce()->(String,String){let raw=Command::new("openssl").args(["rand","-base64","32"]).output().ok().map(|o|String::from_utf8_lossy(&o.stdout).trim().to_string()).unwrap_or_else(||format!("{}",now_bits()));let verifier=b64url(raw.as_bytes());let hash=Command::new("openssl").args(["dgst","-binary","-sha256"]).stdin(Stdio::piped()).stdout(Stdio::piped()).spawn().ok().and_then(|mut c|{if let Some(mut i)=c.stdin.take(){let _=i.write_all(verifier.as_bytes());}c.wait_with_output().ok()});let challenge=hash.map(|o|b64url(&o.stdout)).unwrap_or_else(||verifier.clone());(verifier,challenge)}
fn now_bits()->u64{std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d|d.as_nanos() as u64).unwrap_or(1)}
fn b64url(b:&[u8])->String{const T:&[u8]=b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";let mut s=String::new();let mut i=0;while i<b.len(){let n=(b.len()-i).min(3);let mut v=0u32;for k in 0..n{v|=(b[i+k]as u32)<<(16-8*k);}let chars=match n{1=>2,2=>3,_=>4};for k in 0..chars{s.push(T[((v>>(18-6*k))&63)as usize]as char);}i+=3;}s.replace('+',"-").replace('/',"_")}
pub fn open_url(url:&str){let _=Command::new("open").arg(url).status();}
pub fn listen_code(port:u16,timeout:Duration)->Result<String,String>{let listener=TcpListener::bind(("127.0.0.1",port)).map_err(|e|e.to_string())?;let _=listener.set_nonblocking(true);let start=Instant::now();let(mut stream,_)=loop{if start.elapsed()>timeout{return Err("時間切れ。ブラウザで許可して。".into())}match listener.accept(){Ok(x)=>break x,Err(e)if e.kind()==std::io::ErrorKind::WouldBlock=>std::thread::sleep(Duration::from_millis(80)),Err(e)=>return Err(e.to_string())}};let mut buf=[0u8;8192];let n=stream.read(&mut buf).unwrap_or(0);let req=String::from_utf8_lossy(&buf[..n]);let first=req.lines().next().unwrap_or("");let qs=first.split(' ').nth(1).unwrap_or("").split('?').nth(1).unwrap_or("");let code=qs.split('&').find_map(|p|p.strip_prefix("code=")).unwrap_or("").to_string();let html="HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n接続した。このタブを閉じて HISYO に戻って。";let _=stream.write_all(html.as_bytes());if code.is_empty(){return Err("許可されなかった".into())}Ok(urldec(&code))}
fn urldec(s:&str)->String{let s=s.replace('+'," ");let mut out=Vec::new();let b=s.as_bytes();let mut i=0;while i<b.len(){if b[i]==b'%'&&i+2<b.len(){let hex=&s[i+1..i+3];if let Ok(v)=u8::from_str_radix(hex,16){out.push(v);i+=3;continue;}}out.push(b[i]);i+=1;}String::from_utf8_lossy(&out).into()}
pub fn urlenc(s:&str)->String{let mut out=String::new();for b in s.bytes(){match b{b'A'..=b'Z'|b'a'..=b'z'|b'0'..=b'9'|b'-'|b'_'|b'.'|b'~'=>out.push(b as char),b' '=>out.push('+'),_=>out.push_str(&format!("%{b:02X}")),}}out}
pub fn curl_post(url:&str,headers:&[(&str,&str)],body:&str)->Result<String,String>{let mut cmd=Command::new("curl");cmd.args(["-fsSL","--max-time","12",url,"-d",body]);for(k,v)in headers{cmd.args(["-H",&format!("{k}: {v}")]);}let out=cmd.output().map_err(|e|e.to_string())?;if !out.status.success(){return Err(String::from_utf8_lossy(&out.stderr).into())}Ok(String::from_utf8_lossy(&out.stdout).into())}
pub fn b64(s:&str)->String{let mut child=match Command::new("openssl").args(["base64","-A"]).stdin(Stdio::piped()).stdout(Stdio::piped()).spawn(){Ok(c)=>c,Err(_)=>return String::new()};if let Some(mut i)=child.stdin.take(){let _=i.write_all(s.as_bytes());}child.wait_with_output().ok().map(|o|String::from_utf8_lossy(&o.stdout).trim().to_string()).unwrap_or_default()}
