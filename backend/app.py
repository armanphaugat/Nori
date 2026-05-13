from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers.auth_router    import *
from backend.routers.server_router  import *
from backend.routers.upload_router  import *
from backend.routers.query_router   import *
from backend.routers.channel_router import *
from backend.routers.analytics_router import *
from backend.routers.guild_router import *

app = FastAPI(title="Q-ARAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/", tags=["Health"])
def health_check():
    return {"message": "RAG API running"}