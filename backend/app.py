import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.auth_router    import *
from backend.routers.server_router  import *
from backend.routers.upload_router  import *
from backend.routers.query_router   import *
from backend.routers.channel_router import *
from backend.routers.analytics_router import *
from backend.routers.guild_router import *
from backend.routers.patreon_router import *

app = FastAPI(title="Nori API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3001")
origins = list({
    frontend_url,
    "http://localhost:3001",
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,prefix="/auth",tags=["Auth"])
app.include_router(server_router,prefix="/server",tags=["Server"])
app.include_router(upload_router,prefix="/upload",tags=["Upload"])
app.include_router(query_router,prefix="/query",tags=["Query"])
app.include_router(channel_router,prefix="/channel",tags=["Channel"])
app.include_router(analytics_router,prefix="/analytics",tags=["Analytics"])
app.include_router(guild_router,prefix="/guilds",tags=["Guilds"])
app.include_router(patreon_router,prefix="/patreon",tags=["Patreon"])

@app.get("/", tags=["Health"])
def health_check():
    return {"message": "RAG API running"}