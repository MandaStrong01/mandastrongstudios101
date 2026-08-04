    await new Promise(r=>setTimeout(r,1500));
        const p=await fetch(VOICE_URL,{method:"POST",headers:engineHeaders,body:JSON.stringify({id:d.id})});
        const pd=await p.json();
        url=pickEngineUrl(pd);
        if(url) return url;
        if(pd&&(pd.status==="failed"||pd.status==="canceled")) return "";
      }
    }
  }catch(e){}
  return "";
}