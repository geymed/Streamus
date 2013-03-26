﻿using System;
using System.Reflection;
using Streamus.Backend.Dao;
using Streamus.Backend.Domain.Interfaces;
using log4net;

namespace Streamus.Backend.Domain.Managers
{
    /// <summary>
    ///     Provides a common spot for methods against Users which require transactions (Creating, Updating, Deleting)
    /// </summary>
    public class UserManager
    {
        private static readonly ILog Logger = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        private IUserDao UserDao { get; set; }
        private IStreamDao StreamDao { get; set; }

        public UserManager(IUserDao userDao, IStreamDao streamDao)
        {
            UserDao = userDao;
            StreamDao = streamDao;
        }

        /// <summary>
        ///     Creates a new User and saves it to the DB. As a side effect, also creates a new, empty
        ///     Stream (which has a new, empty Playlist) for the created User and saves it to the DB.
        /// </summary>
        /// <returns>The created user with a generated GUID</returns>
        public User CreateUser()
        {
            User user;
            try
            {
                NHibernateSessionManager.Instance.BeginTransaction();

                user = new User();
                user.ValidateAndThrow();
                UserDao.Save(user);

                //  TODO: Can this happen automatically with NHibernate?
                Stream stream = user.Streams[0];

                stream.FirstListId = stream.Playlists[0].Id;
                stream.Playlists[0].NextListId = stream.Playlists[0].Id;
                stream.Playlists[0].PreviousListId = stream.Playlists[0].Id;
                StreamDao.Update(stream);

                NHibernateSessionManager.Instance.CommitTransaction();
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
                NHibernateSessionManager.Instance.RollbackTransaction();
                throw;
            }

            return user;
        }
    }
}