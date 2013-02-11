﻿using System;
using System.Collections.Generic;
using System.Reflection;
using System.Web.Mvc;
using Streamus.Backend.Dao;
using Streamus.Backend.Domain;
using Streamus.Backend.Domain.Interfaces;
using Streamus.Backend.Domain.Managers;
using log4net;

namespace Streamus.Controllers
{
    public class VideoController : Controller
    {
        private static readonly ILog Logger = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        private readonly IVideoDao VideoDao;

        public VideoController()
        {
            try
            {
                VideoDao = new VideoDao();
            }
            catch (TypeInitializationException exception)
            {
                Logger.Error(exception.InnerException);
                throw exception.InnerException;
            }
        }

        /// <summary>
        ///     Save's a Video. It's a PUT because the video's ID will already
        ///     exist when coming from the client. Still need to decide whether
        ///     the item should be saved or updated, though.
        /// </summary>
        [HttpPut]
        public ActionResult Update(Video video)
        {
            var videoManager = new VideoManager(VideoDao);
            videoManager.Save(video);
            return new JsonDataContractActionResult(video);
        }

        [HttpGet]
        public ActionResult Get(string id)
        {
            var videoManager = new VideoManager(VideoDao);
            Video video = videoManager.Get(id);
            return new JsonDataContractActionResult(video);
        }

        [HttpPost]
        public ActionResult SaveVideos(List<Video> videos)
        {
            var videoManager = new VideoManager(VideoDao);
            videoManager.Save(videos);
            return new JsonDataContractActionResult(videos);
        }

        [HttpGet]
        public ActionResult GetByIds(List<string> ids)
        {
            IList<Video> videos = new List<Video>();

            //  The default model binder doesn't support passing an empty array as JSON to MVC controller, so check null.
            if (ids != null)
            {
                var videoManager = new VideoManager(VideoDao);
                videos = videoManager.Get(ids);
            }

            return new JsonDataContractActionResult(videos);
        }
    }
}