﻿using System;
using System.Collections.Generic;

namespace Streamus.Backend.Domain.DataInterfaces
{
    public interface IPlaylistDao : IDao<Playlist>
    {
        IList<Playlist> GetByUserId(Guid userId);
        Playlist GetByPlaylistItemId(Guid playlistItemId);
        Playlist GetByPosition(Guid userId, int position);
    }
}